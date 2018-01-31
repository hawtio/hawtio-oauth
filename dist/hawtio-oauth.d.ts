/// <reference types="jquery" />
/// <reference types="angular" />
declare let KeycloakConfig: any;
declare let Keycloak: any;
declare let OSOAuthConfig: any;
declare let GoogleOAuthConfig: any;
declare let HAWTIO_OAUTH_CONFIG: any;
declare namespace HawtioOAuth {
    const oauthPlugins: any[];
    function doLogout(): void;
    function getUserProfile(): any;
    function getOAuthToken(): any;
    function authenticatedHttpRequest(options: any): JQuery.jqXHR<any>;
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
    function authenticatedHttpRequest(options: any, userDetails: any): JQuery.jqXHR<any>;
    function setupJQueryAjax(userDetails: any): void;
    function doLogout(config?: any, userDetails?: any): void;
    function doLogin(config: any, options: any): void;
    function exchangeCodeForToken(config: any, code: any, options: any): JQuery.jqXHR<any>;
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
declare namespace HawtioKeycloak {
    const pluginName = "hawtio-oauth-keycloak";
    const log: Logging.Logger;
    let keycloak: any;
    let userProfile: any;
}
declare namespace HawtioKeycloak {
    function doLogout(): void;
}
declare namespace HawtioKeycloak {
    const _module: angular.IModule;
}
declare namespace OSOAuth {
    const pluginName = "hawtio-oauth-os";
    const log: Logging.Logger;
    let userProfile: any;
}
declare namespace OSOAuth {
    function currentTimeSeconds(): number;
    function authenticatedHttpRequest(options: any, userDetails: any): JQuery.jqXHR<any>;
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
