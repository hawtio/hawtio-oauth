/// <reference path="oauth.helper.ts"/>
/// <reference path="github/ts/githubPlugin.ts"/>
/// <reference path="googleOAuth/ts/googleOAuthPlugin.ts"/>
/// <reference path="osOAuth/ts/osOAuthPlugin.ts"/>
/// <reference path="keycloak/keycloak.module.ts"/>

namespace HawtioOAuth {

  const hawtioOAuthModule = angular
    .module(pluginName, [
      'ngIdle',
      GithubOAuth.pluginName,
      GoogleOAuth.pluginName,
      HawtioKeycloak.pluginName,
      OSOAuth.pluginName
    ])
    .run(addLogoutToUserDropdown)
    .name;

  hawtioPluginLoader.addModule(pluginName);

  export function addLogoutToUserDropdown(
    HawtioExtension: Core.HawtioExtension,
    $compile: ng.ICompileService,
    userDetails: Core.AuthService): void {
    'ngInject';

    HawtioExtension.add('hawtio-user', ($scope) => {
      $scope.userDetails = userDetails;
      let template =
        '<li ng-show="userDetails"><a href="" ng-click="userDetails.logout()">Logout</a></li>';
      return $compile(template)($scope);
    });
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
    name: 'HawtioOAuthBootstrap',
    depends: oauthPlugins,
    task: (next) => {
      getUserProfile();
      log.info("All OAuth plugins have been executed:", oauthPlugins);
      next();
    }
  });

}


