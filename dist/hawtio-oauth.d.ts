/// <reference types="jquery" />
/// <reference types="core" />
/// <reference types="angular" />
/// <reference types="utilities" />
declare let KeycloakConfig: any;
declare let Keycloak: any;
declare let OSOAuthConfig: any;
declare let GoogleOAuthConfig: any;
declare let HAWTIO_OAUTH_CONFIG: any;
declare namespace HawtioOAuth {
    const pluginName = "hawtio-oauth";
    const log: Logging.Logger;
    const oauthPlugins: string[];
    let userProfile: any;
    let activePlugin: string;
}
declare namespace HawtioOAuth {
    function getUserProfile(): any;
    function getOAuthToken(): any;
    function authenticatedHttpRequest(options: any): JQueryXHR;
}
declare namespace HawtioOAuth {
    function addLogoutToUserDropdown(HawtioExtension: Core.HawtioExtension, $compile: ng.ICompileService): void;
}
declare namespace HawtioKeycloak {
    const pluginName: string;
    const log: Logging.Logger;
    let keycloak: any;
    type UserProfile = {
        token: string;
    };
    let userProfile: UserProfile;
}
declare namespace HawtioKeycloak {
    class AuthInterceptor {
        private $q;
        private userDetails;
        static Factory($q: ng.IQService, userDetails: Core.UserDetails): AuthInterceptor;
        constructor($q: ng.IQService, userDetails: Core.UserDetails);
        request: (request: any) => angular.IPromise<any>;
        responseError: (rejection: any) => angular.IPromise<any>;
    }
}
declare namespace HawtioKeycloak {
    const hawtioKeycloakModule: string;
    function doLogout(): void;
}
declare namespace GithubOAuth {
    const pluginName = "hawtio-oauth-github";
    const log: Logging.Logger;
    const templatePath = "plugins/github/html";
    function emptyBeforeSend(): boolean;
    function getTokenCheckAuthURL(oauthSettings: any): string;
    function getTokenCheckAuthHeader(oauthSettings: any): string;
    function getAuthHeader(oauthSettings: any): string;
    function loadSettings(): {};
    function storeSettings(settings: any, oauthSettings?: any): void;
}
declare namespace GithubOAuth {
    const _module: angular.IModule;
}
declare namespace GithubOAuth {
}
declare namespace GoogleOAuth {
    const pluginName = "hawtio-oauth-google";
    const log: Logging.Logger;
    let userProfile: any;
}
declare namespace GoogleOAuth {
    function authenticatedHttpRequest(options: any, userDetails: any): JQueryXHR;
    function setupJQueryAjax(userDetails: any): void;
    function doLogout(config?: any, userDetails?: any): void;
    function doLogin(config: any, options: any): void;
    function exchangeCodeForToken(config: any, code: any, options: any): JQueryXHR;
    function extractToken(query: any): {
        type: any;
        token: any;
        expiry: any;
    };
    function clearTokenStorage(): void;
    function getTokenStorage(): any;
    function setTokenStorage(userDetails: any): void;
    function checkToken(query: any): any;
    function checkAuthorizationCode(uri: any): any;
    function fetchUserInfo(http: any, successCallback: any, failureCallback: any): void;
}
declare namespace GoogleOAuth {
    const _module: angular.IModule;
}
declare namespace OSOAuth {
    const pluginName = "hawtio-oauth-os";
    const log: Logging.Logger;
    let userProfile: any;
}
declare namespace OSOAuth {
    function currentTimeSeconds(): number;
    function authenticatedHttpRequest(options: any, userDetails: any): JQueryXHR;
    function doLogout(config?: any, userDetails?: any): void;
    function doLogin(config: any, options: any): void;
    function extractToken(uri: any): {
        token_type: any;
        access_token: any;
        expires_in: any;
        obtainedAt: number;
    };
    function clearTokenStorage(): void;
    function checkToken(uri: any): any;
}
declare namespace OSOAuth {
    const _module: angular.IModule;
}
