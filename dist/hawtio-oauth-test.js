/// <reference path="../defs.d.ts"/>

/// <reference path="../../includes.ts"/>
var Example;
(function (Example) {
    Example.pluginName = "hawtio-google-test";
    Example.log = Logger.get(Example.pluginName);
    Example.templatePath = "test-plugins/example/html";
})(Example || (Example = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="exampleGlobals.ts"/>
var Example;
(function (Example) {
    Example._module = angular.module(Example.pluginName, []);
    var tab = undefined;
    Example._module.config(['$locationProvider', '$routeProvider', 'HawtioNavBuilderProvider', function ($locationProvider, $routeProvider, builder) {
        tab = builder.create().id(Example.pluginName).title(function () { return "Example"; }).href(function () { return "/example"; }).subPath("Page 1", "page1", builder.join(Example.templatePath, 'page1.html')).build();
        builder.configureRouting($routeProvider, tab);
        $locationProvider.html5Mode(true);
    }]);
    Example._module.run(['HawtioNav', function (HawtioNav) {
        HawtioNav.add(tab);
        Example.log.debug("loaded");
    }]);
    // Google
    hawtioPluginLoader.registerPreBootstrapTask(function (next) {
        GoogleOAuthConfig = {
            clientId: '520210845630-173pe9uuvejqvahls9td8b5n4nae0tvm.apps.googleusercontent.com',
            clientSecret: 'Uza-yS-E2Ph1eCcs6OZy-4ui',
            url: 'https://accounts.google.com/o/oauth2/auth',
            scope: 'profile',
            redirectURI: 'http://localhost:9000'
        };
        next();
    }, true);
    // Standard Keycloak server
    // hawtioPluginLoader.registerPreBootstrapTask((next) => {
    //   KeycloakConfig = {
    //     clientId: 'hawtio-client',
    //     url: 'http://localhost:8080/auth',
    //     realm: 'hawtio-demo'
    //   };
    //   next();
    // }, true);
    // openshift
    //hawtioPluginLoader.registerPreBootstrapTask((next) => {
    //  OSOAuthConfig = {
    //    oauth_authorize_uri: "https://localhost:8443/oauth/authorize",
    //    oauth_client_id: "openshift-web-console",
    //    logout_uri: ""
    //  };
    //  next();
    //}, true);
    hawtioPluginLoader.addModule(Example.pluginName);
})(Example || (Example = {}));

/// <reference path="examplePlugin.ts"/>
var Example;
(function (Example) {
    Example.Page1Controller = Example._module.controller("Example.Page1Controller", ['$scope', 'userDetails', function ($scope, userDetails) {
        $scope.userDetails = userDetails;
        $scope.userDetailsStr = angular.toJson(userDetails, true);
        $scope.target = "World!";
    }]);
})(Example || (Example = {}));

angular.module("hawtio-oauth-test-templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("test-plugins/example/html/page1.html","<div class=\"row\">\n  <div class=\"col-md-12\" ng-controller=\"Example.Page1Controller\">\n    <h1>User Details</h1>\n    <button class=\"btn btn-primary\" ng-click=\"userDetails.logout()\">Logout</button>\n    <pre>{{userDetailsStr}}</pre>\n  </div>\n</div>\n");}]); hawtioPluginLoader.addModule("hawtio-oauth-test-templates");