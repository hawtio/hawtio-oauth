/// <reference path="../../includes.ts"/>
/// <reference path="exampleGlobals.ts"/>
module Example {

  export var _module = angular.module(Example.pluginName, []);

  var tab = undefined;

  _module.config(['$locationProvider', '$routeProvider', 'HawtioNavBuilderProvider', ($locationProvider, $routeProvider:ng.route.IRouteProvider, builder:HawtioMainNav.BuilderFactory) => {
    tab = builder.create()
      .id(Example.pluginName)
      .title(() => "Example")
      .href(() => "/example")
      .subPath("Page 1", "page1", builder.join(Example.templatePath, 'page1.html'))
      .build();
    builder.configureRouting($routeProvider, tab);
    $locationProvider.html5Mode(true);
  }]);

  _module.run(['HawtioNav', (HawtioNav:HawtioMainNav.Registry) => {
    HawtioNav.add(tab);
    log.debug("loaded");
  }]);

  // Standard Keycloak server
  /*
  hawtioPluginLoader.registerPreBootstrapTask((next) => {
    KeycloakConfig = {
      clientId: 'hawtio-client',
      url: 'http://localhost:8080/auth',
      realm: 'hawtio-demo' 
    }
    next();
  }, true);
  */

  // openshift
  hawtioPluginLoader.registerPreBootstrapTask((next) => {
    OSOAuthConfig = {
      oauth_authorize_uri: "https://localhost:8443/oauth/authorize",
      oauth_client_id: "openshift-web-console",
      logout_uri: ""
    };
    next();
  }, true);


  hawtioPluginLoader.addModule(Example.pluginName);
}
