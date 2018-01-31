/// <reference path="../../includes.ts"/>
namespace GithubOAuth {

  export const pluginName = 'hawtio-oauth-github';
  export const log: Logging.Logger = Logger.get(pluginName);
  export const templatePath = 'plugins/github/html';

  const LOCAL_STORAGE_KEY = 'GithubOAuthSettings';

  export function emptyBeforeSend() {
    return true;
  }

  export function getTokenCheckAuthURL(oauthSettings) {
    return UrlHelpers.join('https://api.github.com/applications', oauthSettings.clientId, 'tokens', oauthSettings.accessToken);
  }

  export function getTokenCheckAuthHeader(oauthSettings) {
    return Core.getBasicAuthHeader(oauthSettings.clientId, oauthSettings.clientSecret);
  }

  export function getAuthHeader(oauthSettings) {
    let token = oauthSettings.accessToken;
    if (!token) {
      return '';
    }
    return 'token ' + oauthSettings.accessToken;
  }

  export function loadSettings() {
    let answer = {};
    if (LOCAL_STORAGE_KEY in localStorage) {
      let settings = localStorage[LOCAL_STORAGE_KEY];
      try {
        settings = angular.fromJson(settings);
        answer = settings;
      } catch (err) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }
    return answer;
  }

  export function storeSettings(settings, oauthSettings = undefined) {
    let toStore = {
      username: settings.username,
      avatarURL: settings.avatarURL,
      accessToken: settings.accessToken,
      name: settings.name
    };
    if (oauthSettings) {
      oauthSettings.username = toStore.username;
      oauthSettings.avatarURL = toStore.avatarURL;
      oauthSettings.accessToken = toStore.accessToken;
      oauthSettings.name = toStore.name;
    };
    localStorage[LOCAL_STORAGE_KEY] = angular.toJson(toStore);
  }
}

