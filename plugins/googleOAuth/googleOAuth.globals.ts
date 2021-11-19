/// <reference path="../oauth.globals.ts"/>

namespace GoogleOAuth {

  export const pluginName = 'hawtio-oauth-google';
  export const log: Logging.Logger = Logger.get(pluginName);

  export type UserProfile = HawtioOAuth.UserProfile & {
    access_token?: string;
    fullName?: string;
  };

  // Keep this unset unless we have a token
  export let userProfile: UserProfile = null;
}
