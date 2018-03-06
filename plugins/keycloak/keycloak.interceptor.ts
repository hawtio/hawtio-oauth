/// <reference path="keycloak.globals.ts"/>

namespace HawtioKeycloak {

  export class AuthInterceptor {

    static Factory($q: ng.IQService, userDetails: Core.AuthService,
      keycloakService: KeycloakService): AuthInterceptor {
      'ngInject';
      return new AuthInterceptor($q, userDetails, keycloakService);
    }

    constructor(private $q: ng.IQService, private userDetails: Core.AuthService,
      private keycloakService: KeycloakService) {
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
      this.keycloakService.updateToken((token) => {
        this.userDetails.token = token;
        request.headers.Authorization = 'Bearer ' + token;
        deferred.notify();
        deferred.resolve(request);
      });
    }

    responseError = (rejection): ng.IPromise<any> => {
      if (rejection.status === 401 && this.userDetails.loggedIn) {
        this.userDetails.logout();
      }
      return this.$q.reject(rejection);
    };
  }

}
