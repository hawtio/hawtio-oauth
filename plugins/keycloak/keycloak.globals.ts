/// <reference path="../oauth.globals.ts"/>

namespace HawtioKeycloak {

  export type UserProfile = { token: string };

  export const pluginName: string = 'hawtio-oauth-keycloak';
  export const log: Logging.Logger = Logger.get(pluginName);
  export let keycloak: any = null;

  // used by HawtioOAuth, must have a 'token' field when set,
  // otherwise leave null
  export let userProfile: UserProfile = null;

}
