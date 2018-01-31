// Variables for keycloak config and the keycloak object
declare let KeycloakConfig;
declare let Keycloak;

// variable for getting openshift oauth config from
declare let OSOAuthConfig;
declare let GoogleOAuthConfig;

// variable set by server script that contains oauth settings
declare let HAWTIO_OAUTH_CONFIG;

namespace HawtioOAuth {

  const pluginName = 'hawtio-oauth';
  const log: Logging.Logger = Logger.get(pluginName);
  const _module = angular.module(pluginName, []);

  _module.directive('hawtioUserDropdown', ['$compile', '$timeout', ($compile, $timeout) => {
    return {
      restrict: 'C',
      scope: {},
      link: ($scope: any, $element, $attr) => {
        $scope.doLogout = doLogout;
        $scope.userDetails = userProfile;
        let el = $compile('<li ng-show="userDetails.token"><a href="" ng-click="doLogout()">Logout</a></li>')($scope);
        $timeout(() => {
          $element.append(el);
        }, 250);
      }
    }
  }]);

  hawtioPluginLoader.addModule(pluginName);
  hawtioPluginLoader.addModule('ngIdle');

  export const oauthPlugins = [];

  let userProfile: any = undefined;
  let activePlugin: string = undefined;

  export function doLogout() {
    if (!activePlugin) {
      return;
    }
    let plugin = window[activePlugin];
    plugin.doLogout();
  }

  export function getUserProfile() {
    if (!userProfile) {
      activePlugin = _.find(oauthPlugins, (_module) => {
        let p = Core.pathGet(window, [_module, 'userProfile']);
        log.debug("Module: ", _module, " userProfile: ", p);
        return p !== null && p !== undefined;
      });
      userProfile = Core.pathGet(window, [activePlugin, 'userProfile']);
      log.debug("Active OAuth plugin: ", activePlugin);
    }
    return userProfile;
  }

  export function getOAuthToken() {
    let userProfile = getUserProfile();
    if (!userProfile) {
      return null;
    }
    return userProfile.token;
  }

  export function authenticatedHttpRequest(options) {
    return $.ajax(_.extend(options, {
      beforeSend: (request) => {
        let token = getOAuthToken();
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
    name: pluginName,
    depends: HawtioOAuth.oauthPlugins,
    task: (next) => {
      getUserProfile();
      Logger.get(pluginName).info("All oauth plugins have executed");
      next();
    }
  });
}


