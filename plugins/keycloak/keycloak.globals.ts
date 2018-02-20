/// <reference path="../oauth.globals.ts"/>
/// <reference path="../../node_modules/keycloak-js/dist/keycloak.d.ts"/>

namespace HawtioKeycloak {

  export type UserProfile = Keycloak.KeycloakProfile & {
    token?: string
  };

  export type KeycloakConfig = {
    url: string;
    [key: string]: string;
  }

  export const pluginName: string = 'hawtio-oauth-keycloak';
  export const log: Logging.Logger = Logger.get(pluginName);

  /**
   * Variable for Keycloak config that users can initialise.
   */
  export let config: KeycloakConfig = null;

  export let keycloak: Keycloak.KeycloakInstance = null;

  /**
   * Used by HawtioOAuth, must have a 'token' field when set,
   * otherwise leave null
   */
  export let userProfile: UserProfile = null;

}
