/// <reference path="../libs/hawtio-utilities/defs.d.ts"/>

// Variables for keycloak config and the keycloak object
declare var KeycloakConfig;
declare var Keycloak;

// variable for getting openshift oauth config from
declare var OSOAuthConfig;
declare var GoogleOAuthConfig;

// variable set by server script that contains oauth settings
declare var HAWTIO_OAUTH_CONFIG;

module HawtioOAuth {
  var pluginName = 'HawtioOAuth';
  var log:Logging.Logger = Logger.get(pluginName);
  var _module = angular.module(pluginName, []);

  _module.directive('hawtioUserDropdown', ['$compile', '$timeout', ($compile, $timeout) => {
    return {
      restrict: 'C',
      scope: {},
      link: ($scope, $element, $attr) => {
        $scope.doLogout = doLogout;
        $scope.userDetails = userProfile;
        var el = $compile('<li ng-show="userDetails.token"><a href="" ng-click="doLogout()">Logout</a></li>')($scope);
        $timeout(() => {
          $element.append(el);
        }, 250);
      }
    }
  }]);

  hawtioPluginLoader.addModule(pluginName);
  hawtioPluginLoader.addModule('ngIdle');

  export var oauthPlugins = [];

  var userProfile:any = undefined;
  var activePlugin:string = undefined;

  export function doLogout() {
    if (!activePlugin) {
      return;
    }
    var plugin = window[activePlugin];
    plugin.doLogout();
  }

  export function getUserProfile() {
    if (!userProfile) {
      activePlugin = _.find(oauthPlugins, (_module) => {
        var p = Core.pathGet(window, [_module, 'userProfile']);
        log.debug("Module: ", _module, " userProfile: ", p);
        return p !== null && p !== undefined;
      });
      userProfile = Core.pathGet(window, [activePlugin, 'userProfile']);
      log.debug("Active OAuth plugin: ", activePlugin);
    }
    return userProfile;
  }

  export function getOAuthToken() {
    var userProfile = getUserProfile();
    if (!userProfile) {
      return null;
    }
    return userProfile.token;
  }

  export function authenticatedHttpRequest(options) {
    return $.ajax(_.extend(options, {
      beforeSend: (request) => {
        var token = getOAuthToken();
        if (token) {
          request.setRequestHeader('Authorization', 'Bearer ' + token);
        }
      }
    }));
  }

  // fetch oauth config
  hawtioPluginLoader.registerPreBootstrapTask({
    name: 'HawtioOAuthConfig',
    task: (next) => {
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
    task: (next) => {
      getUserProfile();
      Logger.get('hawtio-oauth').info("All oauth plugins have executed");
      next();
    }
  });
}


