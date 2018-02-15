/// <reference path="keycloak.globals.ts"/>
/// <reference path="keycloak.helpers.ts"/>

namespace HawtioKeycloak {

  HawtioOAuth.oauthPlugins.push('HawtioKeycloak');

  export const hawtioKeycloakModule = angular
    .module(pluginName, [])
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
      $httpProvider.interceptors.push(AuthInterceptorService.Factory);
    }
  }

  function configureIdleTimeout(userDetails, Idle, $rootScope): void {
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
      $.getScript(keycloakJsUri).done((script, textStatus) => {
        keycloak = Keycloak(KeycloakConfig);
        keycloak.init({
          onLoad: 'login-required'
        }).success((authenticated) => {
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
        }).error(() => {
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

  class AuthInterceptorService {
    public static $inject = ['$q', 'userDetails'];

    public static Factory($q: ng.IQService, userDetails) {
      return new AuthInterceptorService($q, userDetails);
    }

    constructor(private $q: ng.IQService, private userDetails) {
    }

    request = (request) => {
      // bypass for local templates
      if (request.url.indexOf('http') !== 0) {
        return request;
      }
      let addBearer, deferred;
      addBearer = () => {
        let keycloak = HawtioKeycloak.keycloak;
        return keycloak.updateToken(5).success(() => {
          let token = HawtioKeycloak.keycloak.token;
          this.userDetails.token = token;
          request.headers.Authorization = 'Bearer ' + token;
          deferred.notify();
          return deferred.resolve(request);
        }).error(() => {
          console.log("Couldn't update token");
        });
      };
      deferred = this.$q.defer();
      addBearer();
      return this.$q.when(deferred.promise);
    };

    responseError = (rejection) => {
      if (rejection.status === 401) {
        HawtioKeycloak.keycloak.logout();
      }
      return this.$q.reject(rejection);
    };
  }
  AuthInterceptorService.Factory.$inject = AuthInterceptorService.$inject;

  angular.module(hawtioKeycloakModule).requires.push("ngIdle");
}
