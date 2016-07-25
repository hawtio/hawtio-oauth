/// <reference path="../../includes.ts"/>
/// <reference path="githubHelpers.ts"/>
module GithubOAuth {

  export var _module = angular.module(pluginName, []);

  var settings = {
    enabled: false,
    username: undefined,
    clientId: undefined,
    clientSecret: undefined,
    accessToken: undefined,
    avatarURL: undefined,
    name: undefined,
    scopes: ['user', 'repo', 'read:org'],
    authURL: 'https://github.com/login/oauth/authorize',
    tokenURL: 'https://api.github.com/authorizations',
    loginURL: 'https://api.github.com/user'
  };

  _module.constant('githubOAuthSettings', settings);

  _module.service('GithubOAuth', ['githubOAuthSettings', (settings) => {
    var self = {
      settings: settings,
      hasToken: () => {
        return !Core.isBlank(self.settings.accessToken);
      },
      getToken: () => {
        return self.settings.accessToken;
      },
      getHeader: () => {
        return getAuthHeader(self.settings);
      },
      getPreferencesLink: () => {
        
      }
    }
    return self;
  }]);

  _module.run(['preferencesRegistry', (preferencesRegistry) => {
    preferencesRegistry.addTab("Github", UrlHelpers.join(templatePath, "githubPreferences.html"), () => { return settings.enabled; });
    log.debug("loaded");
  }]);

  hawtioPluginLoader.addModule(pluginName);

  hawtioPluginLoader.registerPreBootstrapTask({
    name: 'GithubOAuthConfig',
    depends: ['HawtioOAuthConfig'],
    task: (next) => {
      var clientId  = settings.clientId = Core.pathGet(HAWTIO_OAUTH_CONFIG, ['github', 'clientId']);
      var clientSecret = settings.clientSecret = Core.pathGet(HAWTIO_OAUTH_CONFIG, ['github', 'clientSecret']);
      if (clientId && clientSecret) {
        log.debug("enabled");
        settings.enabled = true;
      }
      next();
    }
  });

  hawtioPluginLoader.registerPreBootstrapTask({
    name: 'GithubOAuthSettings',
    depends: ['GithubOAuthConfig'],
    task: (next) => {
      if (settings.enabled) {
        _.assign(settings, loadSettings());
      }
      next();
    }
  });

  /*
  hawtioPluginLoader.registerPreBootstrapTask({
    name: 'GithubTokenReader',
    depends: ['GithubOAuthConfig'],
    task: (next) => {
      if (!settings.enabled) {
        next();
        return;
      }
      var uri = new URI();
      var search = uri.search(true);
      var accessCode = search['code'];
      if (accessCode) {
        log.debug("Found github access code");
        delete search['code'];
        $.ajax(settings.tokenURL, <any> {
          method: 'POST',
          data: {
            client_id: settings.clientId
          }

        });
        uri.search(search);
        window.location.href = uri.toString();
      } else {
        next();
      }
    }
  });
  */
}
