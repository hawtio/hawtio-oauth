declare module HawtioKeycloak {
    class AuthInterceptorService {
        private $q;
        private userDetails;
        static $inject: string[];
        static Factory($q: ng.IQService, userDetails: any): AuthInterceptorService;
        constructor($q: ng.IQService, userDetails: any);
        request: (request: any) => ng.IPromise<any>;
        responseError: (rejection: any) => ng.IPromise<void>;
    }
}
