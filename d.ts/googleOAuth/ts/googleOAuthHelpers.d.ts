/// <reference path="googleOAuthGlobals.d.ts" />
declare module GoogleOAuth {
    function authenticatedHttpRequest(options: any, userDetails: any): JQueryXHR;
    function doLogout(config: any, userDetails: any): void;
    function doLogin(config: any, options: any): void;
    function exchangeCodeForToken(config: any, code: any, options: any): void;
    function extractToken(uri: any): {
        token_type: any;
        access_token: any;
        expires_in: any;
    };
    function clearTokenStorage(): void;
    function checkToken(uri: any): any;
    function checkAuthorizationCode(uri: any): any;
}
