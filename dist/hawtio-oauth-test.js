var HawtioOAuth;
(function (HawtioOAuth) {
    var pluginName = 'HawtioOAuth';
    var log = Logger.get(pluginName);
    var _module = angular.module(pluginName, []);
    _module.directive('hawtioUserDropdown', ['$compile', '$timeout', function ($compile, $timeout) {
            return {
                restrict: 'C',
                scope: {},
                link: function ($scope, $element, $attr) {
                    $scope.doLogout = doLogout;
                    $scope.userDetails = userProfile;
                    var el = $compile('<li ng-show="userDetails.token"><a href="" ng-click="doLogout()">Logout</a></li>')($scope);
                    $timeout(function () {
                        $element.append(el);
                    }, 250);
                }
            };
        }]);
    hawtioPluginLoader.addModule(pluginName);
    hawtioPluginLoader.addModule('ngIdle');
    HawtioOAuth.oauthPlugins = [];
    var userProfile = undefined;
    var activePlugin = undefined;
    function doLogout() {
        if (!activePlugin) {
            return;
        }
        var plugin = window[activePlugin];
        plugin.doLogout();
    }
    HawtioOAuth.doLogout = doLogout;
    function getUserProfile() {
        if (!userProfile) {
            activePlugin = _.find(HawtioOAuth.oauthPlugins, function (_module) {
                var p = Core.pathGet(window, [_module, 'userProfile']);
                log.debug("Module: ", _module, " userProfile: ", p);
                return p !== null && p !== undefined;
            });
            userProfile = Core.pathGet(window, [activePlugin, 'userProfile']);
            log.debug("Active OAuth plugin: ", activePlugin);
        }
        return userProfile;
    }
    HawtioOAuth.getUserProfile = getUserProfile;
    function getOAuthToken() {
        var userProfile = getUserProfile();
        if (!userProfile) {
            return null;
        }
        return userProfile.token;
    }
    HawtioOAuth.getOAuthToken = getOAuthToken;
    function authenticatedHttpRequest(options) {
        return $.ajax(_.extend(options, {
            beforeSend: function (request) {
                var token = getOAuthToken();
                if (token) {
                    request.setRequestHeader('Authorization', 'Bearer ' + token);
                }
            }
        }));
    }
    HawtioOAuth.authenticatedHttpRequest = authenticatedHttpRequest;
    // fetch oauth config
    hawtioPluginLoader.registerPreBootstrapTask({
        name: 'HawtioOAuthConfig',
        task: function (next) {
            $.getScript('oauth/config.js').always(next);
        }
    });
    // global pre-bootstrap task that plugins can use to wait
    // until all oauth plugins have been processed
    // 
    // OAuth plugins can add to this list via:
    //
    // HawtioOAuth.oauthPlugins.push(<plugin name>);
    //
    // and then use a named task with the same name as <plugin name>
    //
    hawtioPluginLoader.registerPreBootstrapTask({
        name: 'hawtio-oauth',
        depends: HawtioOAuth.oauthPlugins,
        task: function (next) {
            getUserProfile();
            Logger.get('hawtio-oauth').info("All oauth plugins have executed");
            next();
        }
    });
})(HawtioOAuth || (HawtioOAuth = {}));
/// <reference path="../plugins/includes.ts"/>
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
    Example._module.constant('example-tabs', []);
    Example._module.config(['$locationProvider', '$routeProvider', 'HawtioNavBuilderProvider', 'example-tabs', function ($locationProvider, $routeProvider, builder, tabs) {
            var tab = builder.create()
                .id(Example.pluginName)
                .title(function () { return "Examples"; })
                .href(function () { return "/example"; })
                .subPath("Github", "page2", builder.join(Example.templatePath, 'github.html'))
                .subPath("Openshift OAuth", "page1", builder.join(Example.templatePath, 'page1.html'))
                .build();
            builder.configureRouting($routeProvider, tab);
            $locationProvider.html5Mode(true);
            tabs.push(tab);
        }]);
    Example._module.run(['HawtioNav', 'example-tabs', function (HawtioNav, tabs) {
            _.forEach(tabs, function (tab) { HawtioNav.add(tab); });
            Example.log.debug("loaded");
        }]);
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
            url: 'http://localhost:8080/auth',
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
        var uri = new URI('https://172.28.128.4:8443/api/v1');
        uri.path('/api/v1/namespaces');
        var url = uri.toString();
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
/// <reference path="examplePlugin.ts"/>
var Example;
(function (Example) {
    Example.Page2Controller = Example._module.controller("Example.Page2Controller", ['$scope', 'GithubOAuth', 'HawtioPreferences', function ($scope, GithubOAuth, HawtioPreferences) {
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
        }]);
})(Example || (Example = {}));
/// <reference path="examplePlugin.ts"/>
var Example;
(function (Example) {
    Example.Page1Controller = Example._module.controller("Example.Page1Controller", ['$scope', 'userDetails', function ($scope, userDetails) {
            Example.log.debug("userDetails: ", userDetails);
            $scope.userDetails = userDetails;
            $scope.userDetailsStr = angular.toJson(userDetails, true);
            $scope.target = "World!";
        }]);
})(Example || (Example = {}));

angular.module('hawtio-oauth-test-templates', []).run(['$templateCache', function($templateCache) {$templateCache.put('test-plugins/example/html/github.html','<div  ng-controller="Example.Page2Controller">\n  <div class="row" ng-if="!oauth.hasToken() || data.status === 403">\n    <div class="col-md-12">\n      <div class="alert alert-warning">\n        No Github credentials available, <a href="" ng-click="prefs.goto(\'Github\')">configure your github account</a>\n      </div>\n    </div>\n  </div>\n  <div class="row" ng-if="oauth.hasToken()">\n    <div class="col-md-12">\n      <pre>{{data | json}}</pre>\n    </div>\n  </div>\n</div>\n');
$templateCache.put('test-plugins/example/html/page1.html','<div class="row">\n  <div class="col-md-12" ng-controller="Example.Page1Controller">\n    <h1>User Details</h1>\n    <button class="btn btn-primary" ng-click="userDetails.logout()">Logout</button>\n    <pre>{{userDetailsStr}}</pre>\n  </div>\n</div>\n');}]); hawtioPluginLoader.addModule("hawtio-oauth-test-templates");