/// <reference path="keycloakGlobals.ts"/>
/// <reference path="keycloakHelpers.ts"/>
module HawtioKeycloak {
  export var _module = angular.module(pluginName, []);
  hawtioPluginLoader.addModule(pluginName);

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
              log.debug("Auth Token: ", keycloak.token);
              log.debug("Profile: ", profile);
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
