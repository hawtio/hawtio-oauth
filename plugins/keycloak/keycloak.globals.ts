/// <reference path="../oauth.globals.ts"/>

namespace HawtioKeycloak {

  export type UserProfile = Keycloak.KeycloakProfile & HawtioOAuth.UserProfile;

  export type KeycloakConfig = {
    url: string;
    [key: string]: any;

    /**
     * Hawtio custom option to instruct whether to use JAAS authentication or not.
     * Default: true
     */
    jaas?: boolean;

    /**
     * The method for Proof Key Code Exchange (PKCE) to use.
     * Configuring this value enables the PKCE mechanism. Available options:
     * - "S256" - The SHA256 based PKCE method
     */
    pkceMethod?: string; 
  };

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
