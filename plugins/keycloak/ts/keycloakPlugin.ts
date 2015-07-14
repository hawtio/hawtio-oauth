/// <reference path="keycloakGlobals.ts"/>
/// <reference path="keycloakHelpers.ts"/>
module HawtioKeycloak {
  HawtioOAuth.oauthPlugins.push('HawtioKeycloak');
  export var _module = angular.module(pluginName, []);
  export var userProfile:any = undefined;
  hawtioPluginLoader.addModule(pluginName);

  _module.config(['$provide', '$httpProvider', ($provide, $httpProvider) => {
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

    // only add the itnerceptor if we have keycloak otherwise
    // we'll get an undefined exception in the interceptor
    if (HawtioKeycloak.keycloak) {
      $httpProvider.interceptors.push(AuthInterceptorService.Factory);
    }
  }]);

  _module.run(['userDetails', 'Idle', '$rootScope', (userDetails, Idle, $rootScope) => {
    if (HawtioKeycloak.keycloak) {
      log.debug("Enabling idle timeout");
      Idle.watch();

      $rootScope.$on('IdleTimeout', function() {
        log.debug("Idle timeout triggered");
        // let the end application handle this event
        // userDetails.logout();
      });

      $rootScope.$on('Keepalive', function() {
        var keycloak = HawtioKeycloak.keycloak;
        if (keycloak) {
          keycloak.updateToken(30);
        }
      });
    } else {
      log.debug("Not enabling idle timeout");
    }
  }]);

  hawtioPluginLoader.registerPreBootstrapTask({
    name: 'HawtioKeycloak',
    task: (next) => {
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
        log.debug("Failed to initialize Keycloak, token unavailable");
        next();
      });
    }
  });

  class AuthInterceptorService {
    public static $inject = ['$q'];

    public static Factory($q:ng.IQService) {
      return new AuthInterceptorService($q);
    }

    constructor(private $q:ng.IQService) {
    }

    request = (request) => {
      var addBearer, deferred;
      addBearer = () => {
        var keycloak = HawtioKeycloak.keycloak;
        return keycloak.updateToken(5).success(() => {
          var token = HawtioKeycloak.keycloak.token;
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

  _module.requires.push("ngIdle");
}
