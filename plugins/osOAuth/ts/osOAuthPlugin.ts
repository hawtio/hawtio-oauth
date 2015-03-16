/// <reference path="osOAuthHelpers.ts"/>

module OSOAuth {
  export var _module = angular.module(pluginName, []);
  var userProfile:any = {};
  hawtioPluginLoader.addModule(pluginName);

  _module.config(['$provide', ($provide) => {
    $provide.decorator('userDetails', ['$delegate', ($delegate) => {
      return _.merge($delegate, userProfile);
    }]);
  }]);

  _module.config(['$httpProvider', ($httpProvider) => {
    if (userProfile) {
      $httpProvider.defaults.headers.common = {
        'Authorization': 'Bearer ' + userProfile.token
      }
    }
  }]);

  _module.run(['userDetails', (userDetails) => {
    log.debug("loaded, userDetails: ", userDetails);
  }]);

  hawtioPluginLoader.registerPreBootstrapTask((next) => {
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
      userProfile = {
        token: fragmentParams.access_token,
        expiry: fragmentParams.expires_in,
        type: fragmentParams.token_type
      }
      var uri = new URI(OSOAuthConfig.oauth_authorize_uri);
      uri.path('/osapi/v1beta1/users/~');
      authenticatedHttpRequest({
        type: 'GET',
        url: uri.toString(),
      }, userProfile).done((response) => {
        _.extend(userProfile, response);
      }).fail(() => {
        clearTokenStorage();
        doLogin(OSOAuthConfig, {
          uri: currentURI.toString()
        });
      }).always(() => {
        next();
      });
      log.debug("Have token");
    } else {
      clearTokenStorage();
      doLogin(OSOAuthConfig, {
        uri: currentURI.toString()
      });
    }

  });




  }
