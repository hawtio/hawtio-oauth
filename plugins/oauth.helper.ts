/// <reference path="oauth.globals.ts"/>

namespace HawtioOAuth {

  export function getUserProfile() {
    if (!userProfile) {
      activePlugin = _.find(oauthPlugins, (plugin) => {
        let profile = Core.pathGet(window, [plugin, 'userProfile']);
        log.debug("Module:", plugin, "userProfile:", profile);
        return profile !== null && profile !== undefined;
      });
      userProfile = Core.pathGet(window, [activePlugin, 'userProfile']);
      log.debug("Active OAuth plugin:", activePlugin);
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

}
