# hawtio-oauth

This module contains a couple different OAuth clients that can be configured by other plugins:

1. keycloak - a plugin that integrates with Keycloak
1. osoauth - a plugin that integrates with the OAuth backend used in OpenShift origin

In either case these plugins need to be configured at application bootstrap.

## Keycloak

Simply create a KeycloakConfig at bootstrap:

    hawtioPluginLoader.registerPreBootstrapTask((next) => {
      KeycloakConfig = {
        clientId: 'hawtio-client',
        url: 'http://localhost:8080/auth',
        realm: 'hawtio-demo' 
      };
      next();
    }, true);

You can also set ``KeycloakConfig`` to a string that is the URL to fetch a Keycloak JSON configuration file:

    hawtioPluginLoader.registerPreBootstrapTask((next) => {
      KeycloakConfig = "/keycloak.json";
      next();
    }, true);

The ``KeycloakConfig`` accepts all the parameters that the official Keycloak JavaScript adapter supports.

## Openshift

Very similar to Keycloak, except you initialize the OSOAuthConfig object with the location of the OpenShift API:

    hawtioPluginLoader.registerPreBootstrapTask((next) => {
      OSOAuthConfig = {
        oauth_authorize_uri: "https://localhost:8443/oauth/authorize",
        oauth_client_id: "openshift-web-console",
        logout_uri: ""
      };
      next();
    }, true);

Note in either case we need to pass 'true' to ``hawtioPluginLoader.registerPreBootstrapTask`` so that it's added to the 
start of the bootstrap queue.

In general for OAuth we want to establish the user's credentials at app bootstrap, as many services tend to need them
 to access backend services.
