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
    authURL: 'https://github.com/login/oauth/authorize',
    tokenURL: 'https://github.com/login/oauth/access_token',
    loginURL: 'https://api.github.com/user'
  };

  _module.constant('githubOAuthSettings', settings);

  _module.run(['preferencesRegistry', (preferencesRegistry) => {
    preferencesRegistry.addTab("Github", UrlHelpers.join(templatePath, "githubPreferences.html"));
    log.debug("loaded");
  }]);

  _module.service("GithubOAuth", ['githubOAuthSettings', (settings) => {
    var self = {
      getLoginURL: (returnTo?:string) => {
        if (!returnTo) {
          returnTo = new URI().toString();
        }
        returnTo = URI.encode(returnTo);
        var target = new URI(settings.authURL);
        target.search({
          client_id: settings.clientId,
          redirect_uri: returnTo
        });
        return target.toString();
      }
    }
    return self;
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
