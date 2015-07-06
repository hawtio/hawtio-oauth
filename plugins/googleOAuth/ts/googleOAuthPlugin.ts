/// <reference path="googleOAuthHelpers.ts"/>

module GoogleOAuth {
  export var _module = angular.module(pluginName, []);

  // Keep this unset unless we have a token
  var userProfile:any = null;

  hawtioPluginLoader.addModule(pluginName);

  _module.config(['$provide', ($provide) => {
    $provide.decorator('userDetails', ['$delegate', ($delegate) => {
      var answer = $delegate;
      if (userProfile) {
        _.merge(answer, $delegate, userProfile, {
          username: userProfile.fullName,
          logout: () => {
            doLogout(GoogleOAuthConfig, userProfile);
          }
        });
      }
      return answer;
    }]);
  }]);

  _module.config(['$httpProvider', ($httpProvider) => {
    var token = getTokenStorage();
    if (token) {
      $httpProvider.defaults.headers.common = {
        'Authorization': 'Bearer ' + token
      }
    }
  }]);

  _module.run(['userDetails', (userDetails) => {
    log.debug("loaded, userDetails: ", userDetails);
  }]);

  hawtioPluginLoader.registerPreBootstrapTask((next) => {
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
      userProfile = getTokenStorage();
      if (userProfile && userProfile.token) {
        setupJQueryAjax(userProfile);
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
          userProfile = {};
          _.extend(userProfile, tmp);
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
      }).fail((response) => {
        log.error("Failed");
      }).always(() => {
        log.debug("Next");
        next();
      });
    } else {
      clearTokenStorage();
      doLogin(GoogleOAuthConfig, {
        uri: currentURI.toString()
      });
    }
  });
}
