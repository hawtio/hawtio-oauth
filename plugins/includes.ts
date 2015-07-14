/// <reference path="../libs/hawtio-utilities/defs.d.ts"/>

// Variables for keycloak config and the keycloak object
declare var KeycloakConfig;
declare var Keycloak;

// variable for getting openshift oauth config from
declare var OSOAuthConfig;
declare var GoogleOAuthConfig;

module HawtioOAuth {
  var log:Logging.Logger = Logger.get('hawtio-oauth');

  export var oauthPlugins = [];

  export function getTasks() {
    return _.map(HawtioOAuth.oauthPlugins, (entry) => entry.task);
  }

  var userProfile:any = undefined;

  export function getUserProfile() {
    if (!userProfile) {
      _.forEach(oauthPlugins, (module) => {
        if (!userProfile) {
          userProfile = Core.pathGet(window, [module, 'userProfile']);
        }
      });
      log.debug("Found userProfile: ", userProfile);
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

}

// global pre-bootstrap task that plugins can use to wait
// until all oauth plugins have been processed
// 
// OAuth plugins can add to this list via:
//
// HawtioOAuth.oauthPlugins.push(<plugin name>);
//
// and then use a named task with the same name as <plugin name>
//
console.log("Tasks: ", HawtioOAuth.getTasks());
hawtioPluginLoader.registerPreBootstrapTask({
  name: 'hawtio-oauth',
  depends: HawtioOAuth.oauthPlugins,
  task: (next) => {
    Logger.get('hawtio-oauth').info("All oauth plugins have executed");
    next();
  }
});


