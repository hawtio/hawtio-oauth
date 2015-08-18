/// <reference path="osOAuthHelpers.ts"/>

module OSOAuth {

  HawtioOAuth.oauthPlugins.push('OSOAuth');

  export var _module = angular.module(pluginName, []);

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

  var keepaliveUri:string = undefined;
  var keepaliveInterval:number = undefined;

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
      if (!window['OSOAuthConfig']) {
        log.debug("oauth disabled");
        next();
        return;
      }
      if (!OSOAuthConfig.oauth_client_id ||
          !OSOAuthConfig.oauth_authorize_uri)
      {
        log.debug("Invalid oauth config, disabled oauth");
        next();
        return;
      }
      log.debug("config: ", OSOAuthConfig);
      var currentURI = new URI(window.location.href);
      var fragmentParams = checkToken(currentURI);
      if (fragmentParams) {
        var tmp = {
          token: fragmentParams.access_token,
          expiry: fragmentParams.expires_in,
          type: fragmentParams.token_type
        }
        var uri = new URI(OSOAuthConfig.oauth_authorize_uri);
        uri.path('/oapi/v1/users/~');
        keepaliveUri = uri.toString();
        authenticatedHttpRequest({
          type: 'GET',
          url: keepaliveUri,
        }, tmp).done((response) => {
          userProfile = _.merge(tmp, response, { provider: pluginName });
          if (userProfile.expiry) {
            keepaliveInterval = Math.round(userProfile.expiry / 4);
          } else {
            keepaliveInterval = 600;
          }
          log.debug("userProfile: ", userProfile);
          setTimeout(() => {
            $.ajaxSetup({
              beforeSend: (xhr) => {
                xhr.setRequestHeader('Authorization', 'Bearer ' + tmp.token);
              }
            });
            next();
          }, 10);
        }).fail((jqXHR, textStatus, errorThrown) => {
          log.error("Failed to fetch user info, status: ", textStatus, " error: ", errorThrown);
          clearTokenStorage();
          doLogin(OSOAuthConfig, {
            uri: currentURI.toString()
          });
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
