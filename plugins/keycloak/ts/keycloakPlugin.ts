/// <reference path="keycloakGlobals.ts"/>
/// <reference path="keycloakHelpers.ts"/>
module HawtioKeycloak {
  export var _module = angular.module(pluginName, []);
  var userProfile:any = {};
  hawtioPluginLoader.addModule(pluginName);

  _module.config(['$provide', ($provide) => {
    $provide.decorator('userDetails', ['$delegate', ($delegate) => {
      if (userProfile) {
        return _.merge($delegate, userProfile, {
          logout: () => {
            if (userProfile && keycloak) {
              keycloak.logout();
            }
          }
        });
      } else {
        return $delegate;
      }
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
    // log.debug("loaded, userDetails: ", userDetails);
  }]);

  hawtioPluginLoader.registerPreBootstrapTask((next) => {
    if (!window['KeycloakConfig']) {
      log.debug("Keycloak disabled");
      next();
      return;
    }
    var keycloak = HawtioKeycloak.keycloak = Keycloak(KeycloakConfig);
    keycloak.init()
      .success((authenticated) => {
        log.debug("Authenticated: ", authenticated);
        if (!authenticated) {
          keycloak.login({
            redirectUri: window.location.href,
          });
        } else {
          keycloak.loadUserProfile()
            .success((profile) => {
              userProfile = profile;
              userProfile.token = keycloak.token;
              next();
            }).error(() => {
              log.debug("Failed to load user profile");
              next();
            });
        }
      })
      .error(() => {
        log.debug("Failed to initialize keycloak, token unavailable");
        next();
      });
  });

}
