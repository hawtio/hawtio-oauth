/// <reference path="../oauth.globals.ts"/>

namespace FormAuth {

  export const pluginName = 'hawtio-oauth-form';
  export const log: Logging.Logger = Logger.get(pluginName);

  export const LOCAL_STORAGE_KEY_TOKEN = 'formAuthToken';

  export let oauthConfig: HawtioOAuth.Config = null;

  export type UserProfile = HawtioOAuth.UserProfile & {
  };

  // Keep this unset unless we have a token
  export let userProfile: UserProfile = null;

}
