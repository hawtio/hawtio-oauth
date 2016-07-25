// <reference path="../../includes.ts"/>
module GithubOAuth {
  export var pluginName = 'github-oauth';
  export var log:Logging.Logger = Logger.get(pluginName);
  export var templatePath = 'plugins/github/html';

  var LOCAL_STORAGE_KEY = 'GithubOAuthSettings';

  export function getTokenCheckAuthURL(oauthSettings) {
    return UrlHelpers.join('https://api.github.com/applications', oauthSettings.clientId, 'tokens', oauthSettings.accessToken);
  }

  export function getTokenCheckAuthHeader(oauthSettings) {
    console.log("Settings: ", oauthSettings);
    return Core.getBasicAuthHeader(oauthSettings.clientId, oauthSettings.clientSecret);
  }

  export function getAuthHeader(oauthSettings) {
    var token = oauthSettings.accessToken;
    if (!token) {
      return '';
    }
    return '';
  }

  export function loadSettings() {
    var answer = {};
    if (LOCAL_STORAGE_KEY in localStorage) {
      var settings = localStorage[LOCAL_STORAGE_KEY];
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
    var toStore = {
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

