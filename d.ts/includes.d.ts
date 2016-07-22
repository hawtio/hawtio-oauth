/// <reference path="../libs/hawtio-utilities/defs.d.ts" />
declare var KeycloakConfig: any;
declare var Keycloak: any;
declare var OSOAuthConfig: any;
declare var GoogleOAuthConfig: any;
declare var HAWTIO_OAUTH_CONFIG: any;
declare module HawtioOAuth {
    var oauthPlugins: any[];
    function doLogout(): void;
    function getUserProfile(): any;
    function getOAuthToken(): any;
    function authenticatedHttpRequest(options: any): JQueryXHR;
}
