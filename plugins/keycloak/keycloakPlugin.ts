/// <reference path="keycloak.globals.ts"/>
/// <reference path="keycloak.interceptor.ts"/>

namespace HawtioKeycloak {

  HawtioOAuth.oauthPlugins.push('HawtioKeycloak');

  export const hawtioKeycloakModule = angular
    .module(pluginName, ['ngIdle'])
    .config(decorateUserDetails)
    .run(configureIdleTimeout)
    .name;

  function decorateUserDetails($provide: ng.auto.IProvideService, $httpProvider: ng.IHttpProvider): void {
    'ngInject';

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

    // only add the interceptor if we have keycloak otherwise
    // we'll get an undefined exception in the interceptor
    if (keycloak) {
      $httpProvider.interceptors.push(AuthInterceptor.Factory);
    }
  }

  function configureIdleTimeout(userDetails: Core.UserDetails, Idle: ng.idle.IIdleService, $rootScope): void {
    'ngInject';

    if (keycloak) {
      log.debug("Enabling idle timeout");
      Idle.watch();

      $rootScope.$on('IdleTimeout', () => {
        log.debug("Idle timeout triggered");
        // let the end application handle this event
        // userDetails.logout();
      });

      $rootScope.$on('Keepalive', () => {
        if (keycloak) {
          keycloak.updateToken(5).success(() => {
            userDetails.token = keycloak.token;
          });
        }
      });
    } else {
      log.debug("Not enabling idle timeout");
    }
  }

  hawtioPluginLoader.addModule(pluginName);

  hawtioPluginLoader.registerPreBootstrapTask({
    name: 'HawtioKeycloak',
    task: (next) => {
      if (!window['KeycloakConfig']) {
        log.debug("Keycloak disabled");
        next();
        return;
      }
      let keycloakJsUri = new URI(KeycloakConfig.url).segment('js/keycloak.js').toString();
      $.getScript(keycloakJsUri)
        .done((script, textStatus) => {
          keycloak = Keycloak(KeycloakConfig);
          keycloak.init({ onLoad: 'login-required' })
            .success((authenticated) => {
              log.debug("Authenticated:", authenticated);
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
              log.debug("Failed to initialize Keycloak, token unavailable");
              next();
            });
          // end keycloak.init
        })
        .fail((response) => {
          log.debug("Error fetching keycloak adapter: ", response);
          next();
        });
      // end $.getScript
    }
  });

  export function doLogout() {
    if (userProfile && keycloak) {
      keycloak.logout();
    }
  }
}
