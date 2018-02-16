/// <reference path="oauth.globals.ts"/>
/// <reference path="oauth.helper.ts"/>

namespace HawtioOAuth {

  const hawtioOAuthModule = angular
    .module(pluginName, ['ngIdle'])
    .run(addLogoutToUserDropdown)
    .name;

  hawtioPluginLoader.addModule(pluginName);

  export function addLogoutToUserDropdown(
    HawtioExtension: Core.HawtioExtension,
    $compile: ng.ICompileService): void {
    'ngInject';

    HawtioExtension.add('hawtio-user', ($scope) => {
      $scope.doLogout = doLogout;
      $scope.userDetails = userProfile;
      let template =
        '<li ng-show="userDetails.token"><a href="" ng-click="doLogout()">Logout</a></li>';
      return $compile(template)($scope);
    });
  }

  function doLogout() {
    if (!activePlugin) {
      return;
    }
    let plugin = window[activePlugin];
    plugin.doLogout();
  }

  /*
   * Fetch oauth config
   */
  hawtioPluginLoader.registerPreBootstrapTask({
    name: 'HawtioOAuthConfig',
    task: (next) => {
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
    name: pluginName,
    depends: oauthPlugins,
    task: (next) => {
      getUserProfile();
      Logger.get(pluginName).info("All oauth plugins have executed");
      next();
    }
  });

}


