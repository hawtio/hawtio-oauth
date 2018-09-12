/// <reference path="keycloak.globals.ts"/>
/// <reference path="keycloak.interceptor.ts"/>
/// <reference path="keycloak.service.ts"/>

namespace HawtioKeycloak {

  HawtioOAuth.oauthPlugins.push('HawtioKeycloak');

  angular
    .module(pluginName, ['ngIdle'])
    .config(applyAuthInterceptor)
    .factory('keycloakService', () => new KeycloakService(isKeycloakEnabled(), keycloak))
    .run(loginUserDetails)
    .run(configureIdleTimeout);

  function isKeycloakEnabled(): boolean {
    if (keycloak && userProfile) {
      return true;
    } else {
      return false;
    }
  }

  function applyAuthInterceptor($provide: ng.auto.IProvideService,
    $httpProvider: ng.IHttpProvider): void {
    'ngInject';
    // only add the interceptor if we have keycloak otherwise
    // we'll get an undefined exception in the interceptor
    if (isKeycloakEnabled()) {
      log.debug("Applying AuthInterceptor to $http");
      $httpProvider.interceptors.push(AuthInterceptor.Factory);
    }
  }

  function loginUserDetails(userDetails: Core.AuthService, keycloakService: KeycloakService,
    postLogoutTasks: Core.Tasks): void {
    'ngInject';

    if (!isKeycloakEnabled()) {
      return;
    }

    userDetails.login(userProfile.username, null, userProfile.token);

    keycloakService.setupJQueryAjax(userDetails);

    log.debug("Register 'LogoutKeycloak' to postLogoutTasks");
    postLogoutTasks.addTask('LogoutKeycloak', () => {
      log.info("Log out Keycloak");
      keycloak.logout();
    });
  }

  function configureIdleTimeout(userDetails: Core.AuthService, Idle: ng.idle.IIdleService,
    $rootScope: ng.IRootScopeService): void {
    'ngInject';

    if (!isKeycloakEnabled()) {
      log.debug("Not enabling idle timeout");
      return;
    }

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
  }

  hawtioPluginLoader
    .addModule(pluginName)
    .registerPreBootstrapTask({
      name: 'HawtioKeycloak',
      task: (next) => loadKeycloakJs(next),
      depends: "KeycloakLoginBootstrap"
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
