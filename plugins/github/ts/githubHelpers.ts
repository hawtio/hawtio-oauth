// <reference path="../../includes.ts"/>
module GithubOAuth {
  export var pluginName = 'github-oauth';
  export var log:Logging.Logger = Logger.get(pluginName);
  export var templatePath = 'plugins/github/html';

  var LOCAL_STORAGE_KEY = 'GithubOAuthSettings';

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

  export function storeSettings(settings) {
    var toStore = {
      username: settings.username,
      accessToken: settings.accessToken
    };
    localStorage[LOCAL_STORAGE_KEY] = angular.toJson(toStore);
  }
}

