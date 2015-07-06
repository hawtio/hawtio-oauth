/// <reference path="googleOAuthGlobals.d.ts" />
declare module GoogleOAuth {
    function authenticatedHttpRequest(options: any, userDetails: any): JQueryXHR;
    function setupJQueryAjax(userDetails: any): void;
    function doLogout(config: any, userDetails: any): void;
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
}
