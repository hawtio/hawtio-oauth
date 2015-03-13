/// <reference path="../defs.d.ts"/>

/// <reference path="../../includes.ts"/>
var Example;
(function (Example) {
    Example.pluginName = "hawtio-keycloak-test";
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
    hawtioPluginLoader.registerPreBootstrapTask(function (next) {
        KeycloakConfig = {
            clientId: 'hawtio',
            url: 'http://localhost:8080/auth',
            realm: 'MyRealm'
        };
        next();
    }, true);
    hawtioPluginLoader.addModule(Example.pluginName);
})(Example || (Example = {}));

/// <reference path="examplePlugin.ts"/>
var Example;
(function (Example) {
    Example.Page1Controller = Example._module.controller("Example.Page1Controller", ['$scope', function ($scope) {
        $scope.target = "World!";
    }]);
})(Example || (Example = {}));

angular.module("hawtio-keycloak-test-templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("test-plugins/example/html/page1.html","<div class=\"row\">\n  <div class=\"col-md-12\" ng-controller=\"Example.Page1Controller\">\n    <h1>Page 1</h1>\n    <p>Hello {{target}}</p>\n  </div>\n</div>\n");}]); hawtioPluginLoader.addModule("hawtio-keycloak-test-templates");