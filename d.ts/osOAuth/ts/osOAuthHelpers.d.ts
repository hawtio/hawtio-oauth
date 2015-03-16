/// <reference path="osOAuthGlobals.d.ts" />
declare module OSOAuth {
    function authenticatedHttpRequest(options: any, userDetails: any): JQueryXHR;
    function doLogin(config: any, options: any): void;
    function extractToken(uri: any): any;
    function clearTokenStorage(): void;
    function checkToken(uri: any): any;
}
