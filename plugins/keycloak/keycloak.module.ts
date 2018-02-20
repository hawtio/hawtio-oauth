/// <reference path="keycloak.globals.ts"/>
/// <reference path="keycloak.interceptor.ts"/>

namespace HawtioKeycloak {

  HawtioOAuth.oauthPlugins.push('HawtioKeycloak');

  angular
    .module(pluginName, ['ngIdle'])
    .config(decorateUserDetails)
    .run(configureIdleTimeout);

  function decorateUserDetails($provide: ng.auto.IProvideService, $httpProvider: ng.IHttpProvider): void {
    'ngInject';

    $provide.decorator('userDetails', ['$delegate', ($delegate) => {
      if (userProfile) {
        return _.merge($delegate, userProfile, {
          logout: () => doLogout()
        });
      }
      return $delegate;
    }]);

    // only add the interceptor if we have keycloak otherwise
    // we'll get an undefined exception in the interceptor
    if (keycloak) {
      $httpProvider.interceptors.push(AuthInterceptor.Factory);
    }
  }

  function doLogout() {
    if (userProfile && keycloak) {
      keycloak.logout();
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

  hawtioPluginLoader
    .addModule(pluginName)
    .registerPreBootstrapTask({
      name: 'HawtioKeycloak',
      task: (next) => loadKeycloakJs(next)
    });

  function loadKeycloakJs(callback: () => void): void {
    if (!config) {
      log.debug("Keycloak disabled");
      callback();
      return;
    }
    let keycloakJsUri = new URI(config.url).segment('js/keycloak.js').toString();
    $.getScript(keycloakJsUri)
      .done((script, textStatus) => initKeycloak(callback))
      .fail((response) => {
        log.warn("Error fetching keycloak adapter:", response);
        callback();
      });
  }

  function initKeycloak(callback: () => void): void {
    keycloak = Keycloak(config);
    keycloak.init({ onLoad: 'login-required' })
      .success((authenticated) => {
        log.debug("Authenticated:", authenticated);
        if (!authenticated) {
          keycloak.login({ redirectUri: window.location.href });
          return;
        }
        keycloak.loadUserProfile()
          .success((profile) => {
            userProfile = profile;
            userProfile.token = keycloak.token;
            callback();
          })
          .error(() => {
            log.debug("Failed to load user profile");
            callback();
          });
      })
      .error((error) => {
        log.warn("Failed to initialize Keycloak, token unavailable", error);
        callback();
      });
  }
}
