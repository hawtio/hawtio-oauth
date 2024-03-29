/// <reference path="form.helpers.ts"/>
/// <reference path="jwt-decode.ts"/>
/// <reference path="login/login.module.ts"/>
/// <reference path="../oauth.helper.ts"/>

namespace FormAuth {

  HawtioOAuth.oauthPlugins.push('FormAuth');

  export const _module = angular
    .module(pluginName, [
      FormAuthLogin.pluginName
    ])
    .config(configureHttp)
    .run(loginUser);

  function configureHttp($httpProvider: ng.IHttpProvider): void {
    'ngInject';

    if (userProfile && userProfile.token) {
      $httpProvider.defaults.headers.common = {
        'Authorization': 'Bearer ' + userProfile.token
      };
    }
  }

  function loginUser(authService: Core.AuthService, postLogoutTasks: Core.Tasks,
    $window: ng.IWindowService, $rootScope: ng.IRootScopeService): void {
    'ngInject';

    if (!userProfile) {
      // Not logged in yet
      return;
    }

    // Apply login status to the frontend
    const subject = getSubjectFromToken(userProfile.token);
    authService.login(subject, null, userProfile.token);
    registerPostLogoutTasks(postLogoutTasks, $window, oauthConfig.form.uri);
    Core.$apply($rootScope);
  }

  function getSubjectFromToken(token: string): string {
    const payload = jwtDecode(token);
    return Core.trimLeading(payload.sub, 'system:serviceaccount:');
  }

  function registerPostLogoutTasks(postLogoutTasks: Core.Tasks, $window: ng.IWindowService, formUri: string): void {
    log.debug("Register 'LogoutFormAuth' to postLogoutTasks");
    postLogoutTasks.addTask('LogoutFormAuth', () => {
      log.debug("Clear token storage");
      clearTokenStorage();
      log.debug("Log out, redirecting to:", formUri);
      $window.location.href = formUri;
    });
  }

  hawtioPluginLoader.registerPreBootstrapTask({
    name: 'FormAuth',
    task: (next) => loadToken(next)
  });

  function loadToken(next: () => void): void {
    oauthConfig = window['HAWTIO_OAUTH_CONFIG'];
    if (oauthConfig && oauthConfig.token) {
      useProvidedToken(oauthConfig.token);
      next();
      return;
    }
    if (!validateConfig(oauthConfig)) {
      next();
      return;
    }

    const formConfig = oauthConfig.form;
    log.debug("Form config:", formConfig);
    const currentUri = new URI(window.location.href);
    const token = checkToken(currentUri);
    if (!token) {
      clearTokenStorage();
      doLogin(formConfig, {
        uri: currentUri.toString()
      }, next);
      return;
    }

    userProfile = {
      token: token
    };
    log.debug("userProfile:", userProfile);
    HawtioOAuth.ajaxSetup(userProfile.token);
    next();
  }

  function useProvidedToken(token: string): void {
    log.warn("Loading OAuth token from server. We should switch to using a token provided by the user!");
    userProfile = {
      token: token
    };
    HawtioOAuth.ajaxSetup(token);
  }

  function validateConfig(config: HawtioOAuth.Config): boolean {
    if (!config || !config.form) {
      log.debug("Form auth disabled");
      return false;
    }
    if (!config.form.uri) {
      log.debug("Invalid config, disabled form auth:", config);
      return false;
    }
    return true;
  }

  hawtioPluginLoader.addModule(pluginName);
}
