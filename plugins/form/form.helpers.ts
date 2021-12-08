/// <reference path="form.globals.ts"/>

namespace FormAuth {

  export type LoginOptions = {
    uri: string;
  };

  export function doLogin(config: HawtioOAuth.FormConfig, options: LoginOptions, next: () => void): void {
    log.debug('Login - form URI:    ', config.uri);
    log.debug('Login - redirect URI:', UrlHelpers.extractPath(options.uri));
    if (config.uri === UrlHelpers.extractPath(options.uri)) {
      // We are already in the login form
      log.debug("Login - Already in", config.uri);
      next();
      return;
    }

    const targetUri = new URI(config.uri);
    targetUri.query({
      redirect_uri: options.uri
    });
    const target = targetUri.toString();
    log.debug("Redirecting to URI:", target);
    window.location.href = target;
  }

  export function clearTokenStorage(): void {
    const localStorage = Core.getLocalStorage();
    delete localStorage[LOCAL_STORAGE_KEY_TOKEN];
  }

  export function checkToken(uri: uri.URI): string {
    let token: string;

    // Token has to be provided in local storage
    const localStorage = Core.getLocalStorage();
    if (LOCAL_STORAGE_KEY_TOKEN in localStorage) {
      token = angular.fromJson(localStorage[LOCAL_STORAGE_KEY_TOKEN]);
    }

    log.debug("Using token:", token);
    return token;
  }

}
