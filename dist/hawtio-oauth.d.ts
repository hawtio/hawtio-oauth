/// <reference types="jquery" />
/// <reference types="angular" />
/// <reference types="core" />
declare let OSOAuthConfig: any;
declare let GoogleOAuthConfig: any;
declare let HAWTIO_OAUTH_CONFIG: any;
declare namespace HawtioOAuth {
    const pluginName = "hawtio-oauth";
    const log: Logging.Logger;
    const oauthPlugins: string[];
}
declare namespace HawtioOAuth {
    function getUserProfile(): any;
    function getOAuthToken(): string;
    function authenticatedHttpRequest(options: any): JQueryXHR;
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
declare namespace HawtioKeycloak {
    type UserProfile = Keycloak.KeycloakProfile & {
        token?: string;
    };
    type KeycloakConfig = {
        url: string;
        [key: string]: string;
    };
    const pluginName: string;
    const log: Logging.Logger;
    /**
     * Variable for Keycloak config that users can initialise.
     */
    let config: KeycloakConfig;
    let keycloak: Keycloak.KeycloakInstance;
    /**
     * Used by HawtioOAuth, must have a 'token' field when set,
     * otherwise leave null
     */
    let userProfile: UserProfile;
}
declare namespace HawtioKeycloak {
    class AuthInterceptor {
        private $q;
        private userDetails;
        private keycloak;
        static Factory($q: ng.IQService, userDetails: Core.AuthService): AuthInterceptor;
        constructor($q: ng.IQService, userDetails: Core.AuthService);
        request: (request: any) => angular.IPromise<any>;
        private addBearer(request, deferred);
        responseError: (rejection: any) => angular.IPromise<any>;
    }
}
declare namespace HawtioKeycloak {
    class KeycloakService {
        readonly enabled: boolean;
        readonly keycloak: Keycloak.KeycloakInstance;
        constructor(enabled: boolean, keycloak: Keycloak.KeycloakInstance);
    }
}
declare namespace HawtioKeycloak {
}
declare namespace HawtioOAuth {
}
declare namespace GithubOAuth {
}
