/// <reference path="keycloak.globals.ts"/>

namespace HawtioKeycloak {

  export class AuthInterceptor {

    static Factory($q: ng.IQService, userDetails: Core.UserDetails) {
      'ngInject';
      return new AuthInterceptor($q, userDetails);
    }

    constructor(private $q: ng.IQService, private userDetails: Core.UserDetails) {
      'ngInject';
    }

    request = (request): ng.IPromise<any> => {
      // bypass for local templates
      if (request.url.indexOf('http') !== 0) {
        return request;
      }
      let deferred = this.$q.defer();
      let addBearer = () => {
        let keycloak = HawtioKeycloak.keycloak;
        return keycloak.updateToken(5)
          .success(() => {
            let token = HawtioKeycloak.keycloak.token;
            this.userDetails.token = token;
            request.headers.Authorization = 'Bearer ' + token;
            deferred.notify();
            return deferred.resolve(request);
          })
          .error(() => {
            log.error("Couldn't update token");
          });
      };
      addBearer();
      return this.$q.when(deferred.promise);
    };

    responseError = (rejection): ng.IPromise<any> => {
      if (rejection.status === 401) {
        HawtioKeycloak.keycloak.logout();
      }
      return this.$q.reject(rejection);
    };
  }

}
