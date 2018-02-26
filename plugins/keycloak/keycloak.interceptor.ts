/// <reference path="keycloak.globals.ts"/>

namespace HawtioKeycloak {

  export class AuthInterceptor {

    private keycloak: Keycloak.KeycloakInstance = HawtioKeycloak.keycloak;

    static Factory($q: ng.IQService, userDetails: Core.AuthService) {
      'ngInject';
      return new AuthInterceptor($q, userDetails);
    }

    constructor(private $q: ng.IQService, private userDetails: Core.AuthService) {
      'ngInject';
    }

    request = (request): ng.IPromise<any> => {
      // bypass for local templates
      if (request.url.indexOf('http') !== 0) {
        return request;
      }
      let deferred = this.$q.defer<any>();
      this.addBearer(request, deferred);
      return this.$q.when(deferred.promise);
    };

    private addBearer(request: any, deferred: ng.IDeferred<any>): void {
      this.keycloak.updateToken(5)
        .success(() => {
          let token = this.keycloak.token;
          this.userDetails.token = token;
          request.headers.Authorization = 'Bearer ' + token;
          deferred.notify();
          deferred.resolve(request);
        })
        .error(() => {
          log.error("Couldn't update token");
        });
    }

    responseError = (rejection): ng.IPromise<any> => {
      if (rejection.status === 401) {
        this.keycloak.logout();
      }
      return this.$q.reject(rejection);
    };
  }

}
