/// <reference path="osOAuthHelpers.ts"/>

namespace OSOAuth {

  HawtioOAuth.oauthPlugins.push('OSOAuth');

  export const _module = angular.module(pluginName, ['ngIdle']);

  _module.config(['$provide', ($provide) => {
    $provide.decorator('userDetails', ['$delegate', ($delegate) => {
      if (userProfile) {
        return _.merge($delegate, userProfile, {
          username: userProfile.fullName,
          logout: () => {
            doLogout(OSOAuthConfig, userProfile);
          }
        });
      }
      return $delegate;
    }]);
  }]);

  _module.config(['$httpProvider', ($httpProvider) => {
    if (userProfile && userProfile.token) {
      $httpProvider.defaults.headers.common = {
        'Authorization': 'Bearer ' + userProfile.token
      }
    }
  }]);

  let keepaliveUri: string = undefined;
  let keepaliveInterval: number = undefined;

  _module.config(['KeepaliveProvider', (KeepaliveProvider) => {
    log.debug("keepalive URI: ", keepaliveUri);
    log.debug("keepalive interval: ", keepaliveInterval);
    if (keepaliveUri && keepaliveInterval) {
      KeepaliveProvider.http(keepaliveUri);
      KeepaliveProvider.interval(keepaliveInterval);
    }
  }]);


  _module.run(['userDetails', 'Keepalive', '$rootScope', (userDetails, Keepalive, $rootScope) => {
    if (userProfile && userProfile.token) {
      log.debug("Starting keepalive");
      $rootScope.$on('KeepaliveResponse', ($event, data, status) => {
        log.debug("keepaliveStatus: ", status);
        log.debug("keepalive response: ", data);
        if (status === 401) {
          doLogout(OSOAuthConfig, userProfile);
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
      if (openshiftConfig) {
        let token = openshiftConfig.token;
        if (token) {
          log.warn("Loading OAuth token from server. We should switch to using a real OAuth login!");
          OSOAuth.userProfile = {
            token: token
          };
          $.ajaxSetup({
            beforeSend: (xhr) => {
              xhr.setRequestHeader('Authorization', 'Bearer ' + token);
            }
          });
          next();
          return;
        }
      }
      if (!window['OSOAuthConfig']) {
        log.debug("oauth disabled");
        next();
        return;
      }
      if (!OSOAuthConfig.oauth_client_id ||
        !OSOAuthConfig.oauth_authorize_uri) {
        log.debug("Invalid oauth config, disabled oauth");
        next();
        return;
      }
      log.debug("config: ", OSOAuthConfig);
      let currentURI = new URI(window.location.href);
      let fragmentParams = checkToken(currentURI);
      if (fragmentParams) {
        let tmp = {
          token: fragmentParams.access_token,
          expiry: fragmentParams.expires_in,
          type: fragmentParams.token_type,
          obtainedAt: fragmentParams.obtainedAt || 0
        }
        let uri = new URI(OSOAuthConfig.oauth_authorize_uri);
        uri.path('/oapi/v1/users/~');
        keepaliveUri = uri.toString();
        userProfile = tmp;
        $.ajax({
          type: 'GET',
          url: keepaliveUri,
          success: (response) => {
            _.merge(userProfile, tmp, response, { provider: pluginName });
            let obtainedAt = Core.parseIntValue(userProfile.obtainedAt) || 0;
            let expiry = Core.parseIntValue(userProfile.expiry) || 0;
            if (obtainedAt) {
              let remainingTime = obtainedAt + expiry - currentTimeSeconds();
              if (remainingTime > 0) {
                keepaliveInterval = Math.round(remainingTime / 4);
              }
            }
            if (!keepaliveInterval) {
              keepaliveInterval = 10;
            }
            log.debug("userProfile: ", userProfile);
            $.ajaxSetup({
              beforeSend: xhr => xhr.setRequestHeader('Authorization', 'Bearer ' + userProfile.token)
            });
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
      } else {
        clearTokenStorage();
        doLogin(OSOAuthConfig, {
          uri: currentURI.toString()
        });
      }
    }
  });

  hawtioPluginLoader.addModule(pluginName);
}
