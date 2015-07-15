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
  // hawtioPluginLoader.registerPreBootstrapTask((next) => {
  //   KeycloakConfig = {
  //     clientId: 'hawtio-client',
  //     url: 'http://localhost:8080/auth',
  //     realm: 'hawtio-demo'
  //   };
  //   next();
  // }, true);

  // openshift
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


  hawtioPluginLoader.addModule(Example.pluginName);
}
