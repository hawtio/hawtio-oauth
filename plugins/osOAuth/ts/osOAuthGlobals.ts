/// <reference path="../../oauth.globals.ts"/>

namespace OSOAuth {
  export const pluginName = 'hawtio-oauth-os';
  export const log: Logging.Logger = Logger.get(pluginName);

  export type UserProfile = HawtioOAuth.UserProfile & {
    metadata?: any;
    obtainedAt?: any;
    expiry?: any;
  };

  // Keep this unset unless we have a token
  export let userProfile: UserProfile = null;

}
