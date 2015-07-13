/// <reference path="../libs/hawtio-utilities/defs.d.ts"/>

// Variables for keycloak config and the keycloak object
declare var KeycloakConfig;
declare var Keycloak;

// variable for getting openshift oauth config from
declare var OSOAuthConfig;
declare var GoogleOAuthConfig;

// global pre-bootstrap task that plugins can use to wait
// until all oauth plugins have been processed, add any
// new oauth plugins to the 'depends' list

hawtioPluginLoader.registerPreBootstrapTask({
  name: 'hawtio-oauth',
  depends: ['KeycloakOAuth', 'GoogleOAuth', 'OpenShiftOAuth'],
  task: (next) => {
    Logger.get('hawtio-oauth').info("All oauth plugins have executed");
    next();
  }
});
