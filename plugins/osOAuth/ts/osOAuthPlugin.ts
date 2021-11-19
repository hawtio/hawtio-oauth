/// <reference path="osOAuthHelpers.ts"/>

namespace OSOAuth {

  HawtioOAuth.oauthPlugins.push('OSOAuth');

  export const _module = angular.module(pluginName, ['ngIdle']);

  _module.config(['$provide', ($provide) => {
    $provide.decorator('userDetails', ['$delegate', ($delegate: Core.AuthService) => {
      if (userProfile) {
        const logout = $delegate.logout;
        // The decorated delegate should ideally not be mutated though AuthService declares getters and setters that are not easy to port over the decoratee.
        return _.merge($delegate, userProfile, {
          logout: () => {
            logout();
            doLogout(OSOAuthConfig, userProfile);
          }
        });
      }
      return $delegate;
    }]);
  }]);

  _module.config(['$httpProvider', ($httpProvider: ng.IHttpProvider) => {
    if (userProfile && userProfile.token) {
      $httpProvider.defaults.headers.common = {
        'Authorization': 'Bearer ' + userProfile.token
      };
    }
  }]);

  let keepaliveUri: string = undefined;
  let keepaliveInterval: number = undefined;

  _module.config(['KeepaliveProvider', (KeepaliveProvider) => {
    log.debug("keepalive URI:", keepaliveUri);
    log.debug("keepalive interval:", keepaliveInterval);
    if (keepaliveUri && keepaliveInterval) {
      KeepaliveProvider.http(keepaliveUri);
      KeepaliveProvider.interval(keepaliveInterval);
    }
  }]);


  _module.run(['userDetails', 'Keepalive', '$rootScope', (userDetails: Core.AuthService, Keepalive, $rootScope) => {
    if (userProfile && userProfile.token) {
      userDetails.login(userProfile.metadata.name, null, userProfile.token);
      log.debug("Starting keepalive");
      $rootScope.$on('KeepaliveResponse', ($event, data, status) => {
        log.debug("keepaliveStatus:", status);
        log.debug("keepalive response:", data);
        if (status === 401) {
          userDetails.logout();
        }
      });
      Keepalive.start();
    }

  }]);

  hawtioPluginLoader.registerPreBootstrapTask({
    name: 'OSOAuth',
    task: (next) => {
      let openshiftConfig = null;
      try {
        openshiftConfig = window['OPENSHIFT_CONFIG'];
      } catch (e) {
        // ignore
      }
      if (openshiftConfig && openshiftConfig.token) {
        useProvidedToken(openshiftConfig.token);
        next();
        return;
      }
      if (!validateConfig()) {
        next();
        return;
      }

      log.debug("config:", OSOAuthConfig);
      const currentURI = new URI(window.location.href);
      const fragmentParams = checkToken(currentURI);
      if (!fragmentParams) {
        clearTokenStorage();
        doLogin(OSOAuthConfig, {
          uri: currentURI.toString()
        });
        return;
      }

      const tmp = {
        token: fragmentParams.access_token,
        expiry: fragmentParams.expires_in,
        type: fragmentParams.token_type,
        obtainedAt: fragmentParams.obtainedAt || 0
      };
      keepaliveUri = buildKeepaliveUri(openshiftConfig);
      userProfile = tmp;
      $.ajax({
        type: 'GET',
        url: keepaliveUri,
        success: (response) => {
          _.merge(userProfile, tmp, response, { provider: pluginName });
          const obtainedAt = Core.parseIntValue(userProfile.obtainedAt) || 0;
          const expiry = Core.parseIntValue(userProfile.expiry) || 0;
          if (obtainedAt) {
            const remainingTime = obtainedAt + expiry - currentTimeSeconds();
            if (remainingTime > 0) {
              keepaliveInterval = Math.round(remainingTime / 4);
            }
          }
          if (!keepaliveInterval) {
            keepaliveInterval = 10;
          }
          log.debug("userProfile:", userProfile);
          ajaxSetup(userProfile.token);
          next();
        },
        error: (jqXHR, textStatus, errorThrown) => {
          // The request may have been cancelled as the browser refresh request in
          // extractToken may be triggered before getting the AJAX response.
          // In that case, let's just skip the error and go through another refresh cycle.
          // See http://stackoverflow.com/questions/2000609/jquery-ajax-status-code-0 for more details.
          if (jqXHR.status > 0) {
            log.error('Failed to fetch user info, status: ', textStatus, ' error: ', errorThrown);
            clearTokenStorage();
            doLogin(OSOAuthConfig, { uri: currentURI.toString() });
          }
        },
        beforeSend: request => request.setRequestHeader('Authorization', 'Bearer ' + userProfile.token)
      });
    }
  });

  function useProvidedToken(token: string): void {
    log.warn("Loading OAuth token from server. We should switch to using a real OAuth login!");
    OSOAuth.userProfile = {
      token: token
    };
    ajaxSetup(token);
  }

  function validateConfig(): boolean {
    if (!window['OSOAuthConfig']) {
      log.debug("oauth disabled");
      return false;
    }
    if (!OSOAuthConfig.oauth_client_id || !OSOAuthConfig.oauth_authorize_uri) {
      log.debug("Invalid oauth config, disabled oauth");
      return false;
    }
    return true;
  }

  function buildKeepaliveUri(openshiftConfig: any): string {
    let uri: uri.URI;
    if (openshiftConfig && openshiftConfig.master_uri) {
      uri = new URI(openshiftConfig.master_uri);
      uri.segment('apis/user.openshift.io/v1/users/~');
    } else {
      uri = new URI(OSOAuthConfig.oauth_authorize_uri);
      uri.path('/apis/user.openshift.io/v1/users/~');
    }
    return uri.toString();
  }

  hawtioPluginLoader.addModule(pluginName);
}
