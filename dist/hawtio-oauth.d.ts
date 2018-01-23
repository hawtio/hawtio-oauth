/// <reference types="jquery" />
/// <reference types="angular" />
declare var KeycloakConfig: any;
declare var Keycloak: any;
declare var OSOAuthConfig: any;
declare var GoogleOAuthConfig: any;
declare var HAWTIO_OAUTH_CONFIG: any;
declare namespace HawtioOAuth {
    var oauthPlugins: any[];
    function doLogout(): void;
    function getUserProfile(): any;
    function getOAuthToken(): any;
    function authenticatedHttpRequest(options: any): JQuery.jqXHR<any>;
}
declare namespace GithubOAuth {
    var pluginName: string;
    var log: Logging.Logger;
    var templatePath: string;
    function emptyBeforeSend(): boolean;
    function getTokenCheckAuthURL(oauthSettings: any): string;
    function getTokenCheckAuthHeader(oauthSettings: any): string;
    function getAuthHeader(oauthSettings: any): string;
    function loadSettings(): {};
    function storeSettings(settings: any, oauthSettings?: any): void;
}
declare namespace GithubOAuth {
    var _module: angular.IModule;
}
declare namespace GithubOAuth {
}
declare namespace GoogleOAuth {
    var pluginName: string;
    var log: Logging.Logger;
    var userProfile: any;
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
    var _module: angular.IModule;
}
declare namespace HawtioKeycloak {
    var pluginName: string;
    var log: Logging.Logger;
    var keycloak: any;
    var userProfile: any;
}
declare namespace HawtioKeycloak {
    function doLogout(): void;
}
declare namespace HawtioKeycloak {
    var _module: angular.IModule;
}
declare namespace OSOAuth {
    var pluginName: string;
    var log: Logging.Logger;
    var userProfile: any;
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
    var _module: angular.IModule;
}
