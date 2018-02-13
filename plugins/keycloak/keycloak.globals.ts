/// <reference path="../includes.ts"/>

namespace HawtioKeycloak {
  export const pluginName: string = 'hawtio-oauth-keycloak';
  export const log: Logging.Logger = Logger.get(pluginName);
  export let keycloak: any = null;

  // used by HawtioOAuth, must have a 'token' field when set,
  // otherwise leave null
  export let userProfile: { token: any } = null;
}
