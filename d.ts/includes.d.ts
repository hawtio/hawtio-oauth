/// <reference path="../libs/hawtio-utilities/defs.d.ts" />
declare var KeycloakConfig: any;
declare var Keycloak: any;
declare var OSOAuthConfig: any;
declare var GoogleOAuthConfig: any;
declare module HawtioOAuth {
    var oauthPlugins: any[];
    function getTasks(): any[];
    function getUserProfile(): any;
    function getOAuthToken(): any;
    function authenticatedHttpRequest(options: any): JQueryXHR;
}
