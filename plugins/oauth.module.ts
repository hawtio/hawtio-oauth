/// <reference path="oauth.helper.ts"/>
/// <reference path="github/github.module.ts"/>
/// <reference path="googleOAuth/googleOAuth.module.ts"/>
/// <reference path="osOAuth/osOAuth.module.ts"/>
/// <reference path="keycloak/keycloak.module.ts"/>
/// <reference path="form/form.module.ts"/>

namespace HawtioOAuth {

  const hawtioOAuthModule = angular
    .module(pluginName, [
      'ngIdle',
      FormAuth.pluginName,
      GithubOAuth.pluginName,
      GoogleOAuth.pluginName,
      HawtioKeycloak.pluginName,
      OSOAuth.pluginName
    ])
    .run(addProductInfo)
    .name;

  hawtioPluginLoader.addModule(pluginName);

  function addProductInfo(aboutService: About.AboutService) {
    'ngInject';
    aboutService.addProductInfo('Hawtio OAuth', 'PACKAGE_VERSION_PLACEHOLDER');
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


