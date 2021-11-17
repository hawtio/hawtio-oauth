/// <reference path="oauth.globals.ts"/>

namespace HawtioOAuth {

  let userProfile: UserProfile = null;

  export function getUserProfile(): UserProfile {
    if (!userProfile) {
      log.debug("Finding 'userProfile' from the active OAuth plugin");
      findUserProfile();
    }
    return userProfile;
  }

  function findUserProfile(): void {
    let activePlugin = _.find(oauthPlugins, (plugin) => {
      let profile = Core.pathGet(window, [plugin, 'userProfile']);
      log.debug("Module:", plugin, "userProfile:", profile);
      return !_.isNil(profile);
    });
    userProfile = Core.pathGet(window, [activePlugin, 'userProfile']);
    log.debug("Active OAuth plugin:", activePlugin);
  }

  export function getOAuthToken(): string {
    let userProfile = getUserProfile();
    if (!userProfile) {
      return null;
    }
    return userProfile.token;
  }

  export function authenticatedHttpRequest(options): JQueryXHR {
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
