/// <reference path="googleOAuthHelpers.ts"/>

namespace GoogleOAuth {
  HawtioOAuth.oauthPlugins.push('GoogleOAuth');
  export var _module = angular.module(pluginName, []);

  hawtioPluginLoader.addModule(pluginName);

  _module.config(['$provide', ($provide) => {
    $provide.decorator('userDetails', ['$delegate', ($delegate) => {
      if (userProfile) {
        return _.merge($delegate, userProfile, {
          username: userProfile.fullName,
          logout: () => {
            doLogout(GoogleOAuthConfig, userProfile);
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

  _module.run(['userDetails', (userDetails) => {

  }]);

  hawtioPluginLoader.registerPreBootstrapTask({
    name: 'GoogleOAuth',
    task: (next) => {
      if (!window['GoogleOAuthConfig']) {
        log.debug("oauth disabled");
        next();
        return;
      }
      if (!GoogleOAuthConfig.clientId ||
          !GoogleOAuthConfig.redirectURI ||
          !GoogleOAuthConfig.scope ||
          !GoogleOAuthConfig.authenticationURI)
      {
        log.warn("Invalid oauth config, disabled oauth", GoogleOAuthConfig);
        next();
        return;
      }
      log.debug("config: ", GoogleOAuthConfig);
      var currentURI = new URI(window.location.href);

      try {
        var userDetails = getTokenStorage();
        if (userDetails && userDetails.token) {
          userProfile = userDetails;
          // setupJQueryAjax(userDetails);
          next();
          return;
        } else {
          // old format, let's force an update by re-authenticating
          clearTokenStorage();
        }
      } catch (err) {
        // must be a bad stored token
        clearTokenStorage();
      }

      var authorizationCode = checkAuthorizationCode(currentURI);
      if (authorizationCode) {
        log.info("found an authorization code so need to go back to google and get a token");
        exchangeCodeForToken(GoogleOAuthConfig, authorizationCode, {
          uri: currentURI.toString(),
        }).done((response) => {
          if (response && response.access_token) {
            var tmp = {
              token: response.access_token,
              expiry: response.expires_in,
              type: response.token_type
            };
            userProfile = _.merge(tmp, response, { provider: pluginName });
            setTokenStorage(userProfile);
            setupJQueryAjax(userProfile);
            log.info("Logged in with URL: " + window.location.href);
            // lets remove the auth code
            var uri = new URI(window.location.href).removeQuery("code");
            var target = uri.toString();
            log.info("Now redirecting to: " + target);
            window.location.href = target;
          } else {
            log.debug("No access token received!");
            clearTokenStorage();
            doLogin(GoogleOAuthConfig, {
              uri: currentURI.toString()
            });
          }
        }).fail((jqHXR, textStatus, errorThrown) => {
          log.error("Failed to fetch auth code, status: ", textStatus, " error: ", errorThrown);
          clearTokenStorage();
          doLogin(GoogleOAuthConfig, {
            uri: currentURI.toString()
          });
        });
      } else {
        clearTokenStorage();
        doLogin(GoogleOAuthConfig, {
          uri: currentURI.toString()
        });
      }
    }
  });
}
