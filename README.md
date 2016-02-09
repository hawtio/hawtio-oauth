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

## Developing

If you plan to contribute to this project or run it locally for testing, you'll need either an OpenShift Origin 
installation or a Keycloak server. 

To start developing, install all the ``npm`` and ``bower`` dependencies: 

    npm install
    ./node_modules/.bin/bower install

And then just execute ``gulp connect``. It will start a simple web server that is updated every time a new change in 
the target files is detected. If your browser is supported, the page is also refreshed when changes are detected.

    ./node_modules/.bin/gulp connect

The application is available at [http://0.0.0.0:9000](http://0.0.0.0:9000) . If you add any extra dependency, you'll 
need to execute the first steps again. 

### Keycloak setup for development

You can import the realm sample file located in 
[test-plugins/hawtio-demo-realm.json](test-plugins/hawtio-demo-realm.json) into Keycloak. To do that, start Keycloak 
and select "Add Realm" and then select the sample JSON file. Alternatively, you can import the file automatically on 
the first boot:

    ./bin/standalone.sh -Dkeycloak.import=/path/to/hawtio-demo-realm.json

If you decide to import this file, an user will be available for testing. The username is ``jdoe`` and the password is 
``password``.

#### Output build to a different directory

When developing this plugin in a dependent console you can change the output directory where the compiled .js and .css go.  Just use the 'out' flag to set a different output directory, for example:

`gulp watch --out=../fabric8-console/libs/hawtio-oauth/dist/`

Whenever the build completes the compiled .js file will be put into the target directory.  Don't forget to first do a `gulp build` without this flag before committing changes!

