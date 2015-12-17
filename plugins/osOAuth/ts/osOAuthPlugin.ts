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
          type: fragmentParams.token_type,
          obtainedAt: fragmentParams.obtainedAt || 0
        }
        var uri = new URI(OSOAuthConfig.oauth_authorize_uri);
        uri.path('/oapi/v1/users/~');
        keepaliveUri = uri.toString();
        userProfile = tmp;
        $.ajax({
          type: 'GET',
          url: keepaliveUri,
          success: (response) => {
            _.merge(userProfile, tmp, response, { provider: pluginName });
            var obtainedAt = Core.parseIntValue(userProfile.obtainedAt) || 0;
            var expiry = Core.parseIntValue(userProfile.expiry) || 0;
            if (obtainedAt) {
              var remainingTime = obtainedAt + expiry - currentTimeSeconds();
              if (remainingTime > 0) {
                keepaliveInterval = Math.round(remainingTime / 4);
              }
            }
            if (!keepaliveInterval) {
              keepaliveInterval = 10;
            }
            log.debug("userProfile: ", userProfile);
            $.ajaxSetup({
              beforeSend: (xhr) => {
                xhr.setRequestHeader('Authorization', 'Bearer ' + userProfile.token);
              }
            });
            next();
          },
          error: (jqXHR, textStatus, errorThrown) => {
            log.error("Failed to fetch user info, status: ", textStatus, " error: ", errorThrown);
            clearTokenStorage();
            doLogin(OSOAuthConfig, {
              uri: currentURI.toString()
            });
          },
          beforeSend: (request) => {
            request.setRequestHeader('Authorization', 'Bearer ' +  userProfile.token);
          }
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
