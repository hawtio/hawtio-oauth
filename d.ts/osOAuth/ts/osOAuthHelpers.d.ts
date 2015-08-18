/// <reference path="osOAuthGlobals.d.ts" />
declare module OSOAuth {
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
