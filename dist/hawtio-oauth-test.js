var HawtioOAuth;
(function (HawtioOAuth) {
    HawtioOAuth.pluginName = 'hawtio-oauth';
    HawtioOAuth.log = Logger.get(HawtioOAuth.pluginName);
    HawtioOAuth.oauthPlugins = [];
    HawtioOAuth.userProfile = undefined;
    HawtioOAuth.activePlugin = undefined;
})(HawtioOAuth || (HawtioOAuth = {}));
/// <reference path="oauth.globals.ts"/>
var HawtioOAuth;
(function (HawtioOAuth) {
    addLogoutToUserDropdown.$inject = ["HawtioExtension", "$compile"];
    var hawtioOAuthModule = angular
        .module(HawtioOAuth.pluginName, ['ngIdle'])
        .run(addLogoutToUserDropdown)
        .name;
    hawtioPluginLoader.addModule(HawtioOAuth.pluginName);
    function addLogoutToUserDropdown(HawtioExtension, $compile) {
        'ngInject';
        HawtioExtension.add('hawtio-user', function ($scope) {
            $scope.doLogout = doLogout;
            $scope.userDetails = HawtioOAuth.userProfile;
            var template = '<li ng-show="userDetails.token"><a href="" ng-click="doLogout()">Logout</a></li>';
            return $compile(template)($scope);
        });
    }
    HawtioOAuth.addLogoutToUserDropdown = addLogoutToUserDropdown;
    function doLogout() {
        if (!HawtioOAuth.activePlugin) {
            return;
        }
        var plugin = window[HawtioOAuth.activePlugin];
        plugin.doLogout();
    }
    /*
     * Fetch oauth config
     */
    hawtioPluginLoader.registerPreBootstrapTask({
        name: 'HawtioOAuthConfig',
        task: function (next) {
            $.getScript('oauth/config.js').always(next);
        }
    });
    /*
     * Global pre-bootstrap task that plugins can use to wait
     * until all oauth plugins have been processed
     *
     * OAuth plugins can add to this list via:
     *
     *   HawtioOAuth.oauthPlugins.push(<plugin name>);
     *
     * and then use a named task with the same name as <plugin name>
     */
    hawtioPluginLoader.registerPreBootstrapTask({
        name: HawtioOAuth.pluginName,
        depends: HawtioOAuth.oauthPlugins,
        task: function (next) {
            getUserProfile();
            Logger.get(HawtioOAuth.pluginName).info("All oauth plugins have executed");
            next();
        }
    });
})(HawtioOAuth || (HawtioOAuth = {}));
/// <reference path="../plugins/oauth.module.ts"/>
var Example;
(function (Example) {
    Example.pluginName = "hawtio-example-oauth";
    Example.log = Logger.get(Example.pluginName);
    Example.templatePath = "test-plugins/example";
})(Example || (Example = {}));
var Example;
(function (Example) {
    page1Controller.$inject = ["$scope", "userDetails"];
    function page1Controller($scope, userDetails) {
        'ngInject';
        Example.log.debug("userDetails: ", userDetails);
        $scope.userDetails = userDetails;
        $scope.userDetailsStr = angular.toJson(userDetails, true);
        $scope.target = "World!";
    }
    Example.page1Controller = page1Controller;
})(Example || (Example = {}));
var Example;
(function (Example) {
    page2Controller.$inject = ["$scope", "GithubOAuth", "HawtioPreferences"];
    function page2Controller($scope, GithubOAuth, HawtioPreferences) {
        'ngInject';
        var oauth = $scope.oauth = GithubOAuth;
        $scope.prefs = HawtioPreferences;
        if (oauth.hasToken()) {
            $.ajax('https://api.github.com/user/orgs', {
                method: 'GET',
                headers: {
                    'Authorization': oauth.getHeader(),
                },
                success: function (data) {
                    $scope.data = data;
                },
                error: function (data) {
                    $scope.data = data;
                },
                complete: function () {
                    Core.$apply($scope);
                },
                beforeSend: GithubOAuth.emptyBeforeSend
            });
        }
    }
    Example.page2Controller = page2Controller;
})(Example || (Example = {}));
/// <reference path="../includes.ts"/>
/// <reference path="example.globals.ts"/>
/// <reference path="page1.controller.ts"/>
/// <reference path="github.controller.ts"/>
var Example;
(function (Example) {
    buildTabs.$inject = ["$locationProvider", "$routeProvider", "HawtioNavBuilderProvider", "tabs"];
    loadTabs.$inject = ["HawtioNav", "tabs"];
    Example.exampleModule = angular
        .module(Example.pluginName, [])
        .constant('tabs', [])
        .config(buildTabs)
        .run(loadTabs)
        .controller("Example.Page1Controller", Example.page1Controller)
        .controller("Example.Page2Controller", Example.page2Controller)
        .name;
    function buildTabs($locationProvider, $routeProvider, HawtioNavBuilderProvider, tabs) {
        'ngInject';
        var tab = HawtioNavBuilderProvider.create()
            .id(Example.pluginName)
            .title(function () { return "Examples"; })
            .href(function () { return "/example"; })
            .subPath("OpenShift OAuth", "page1", HawtioNavBuilderProvider.join(Example.templatePath, 'page1.html'))
            .subPath("GitHub", "page2", HawtioNavBuilderProvider.join(Example.templatePath, 'github.html'))
            .build();
        HawtioNavBuilderProvider.configureRouting($routeProvider, tab);
        $locationProvider.html5Mode(true);
        tabs.push(tab);
    }
    function loadTabs(HawtioNav, tabs) {
        'ngInject';
        _.forEach(tabs, function (tab) { return HawtioNav.add(tab); });
        Example.log.debug("loaded");
    }
    // Google
    /*
    hawtioPluginLoader.registerPreBootstrapTask((next) => {
      GoogleOAuthConfig = {
        clientId: '520210845630-173pe9uuvejqvahls9td8b5n4nae0tvm.apps.googleusercontent.com',
        clientSecret: 'Uza-yS-E2Ph1eCcs6OZy-4ui',
        authenticationURI: 'https://accounts.google.com/o/oauth2/auth',
        scope: 'profile',
        redirectURI: 'http://localhost:9000'
      };
      next();
    }, true);
    */
    // Standard Keycloak server
    hawtioPluginLoader.registerPreBootstrapTask(function (next) {
        KeycloakConfig = {
            clientId: 'hawtio-client',
            url: 'http://localhost:18080/auth',
            realm: 'hawtio-demo'
        };
        next();
    }, true);
    // openshift
    /*
    hawtioPluginLoader.registerPreBootstrapTask((next) => {
      OSOAuthConfig = {
        oauth_authorize_uri: "https://172.28.128.4:8443/oauth/authorize",
        oauth_client_id: "fabric8",
        logout_uri: ""
      };
      next();
    }, true);
  
    hawtioPluginLoader.registerPreBootstrapTask({
      name: 'test-init',
      depends: ['hawtio-oauth'],
      task: (next) => {
        let uri = new URI('https://172.28.128.4:8443/api/v1');
        uri.path('/api/v1/namespaces');
        let url = uri.toString();
        HawtioOAuth.authenticatedHttpRequest({
          url: uri.toString()
        }).done((data) => {
          log.debug("Got data: ", data);
          next();
        }).fail((xHr, textStatus, errorThrown) => {
          log.warn(textStatus, errorThrown);
          HawtioOAuth.doLogout();
        });
      }
    });
    */
    hawtioPluginLoader.addModule(Example.pluginName);
})(Example || (Example = {}));

angular.module('hawtio-oauth-test-templates', []).run(['$templateCache', function($templateCache) {$templateCache.put('test-plugins/example/github.html','<div ng-controller="Example.Page2Controller">\n  <div class="row" ng-if="!oauth.hasToken() || data.status === 403">\n    <div class="col-md-12">\n      <div class="alert alert-warning">\n        No GitHub credentials available, <a href="" ng-click="prefs.goto(\'Github\')">configure your GitHub account</a>\n      </div>\n    </div>\n  </div>\n  <div class="row" ng-if="oauth.hasToken()">\n    <div class="col-md-12">\n      <pre>{{data | json}}</pre>\n    </div>\n  </div>\n</div>\n');
$templateCache.put('test-plugins/example/page1.html','<div ng-controller="Example.Page1Controller">\n  <h1>User Details</h1>\n  <pre>{{userDetailsStr}}</pre>\n</div>\n');}]); hawtioPluginLoader.addModule("hawtio-oauth-test-templates");