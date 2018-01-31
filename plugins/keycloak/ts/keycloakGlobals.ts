/// <reference path="../../includes.ts"/>

namespace HawtioKeycloak {
  export const pluginName = 'hawtio-oauth-keycloak';
  export const log: Logging.Logger = Logger.get(pluginName);
  export let keycloak: any = undefined;

  // used by HawtioOAuth, must have a 'token' field when set, otherwise
  // leave undefined
  export let userProfile: any = undefined;
} 
