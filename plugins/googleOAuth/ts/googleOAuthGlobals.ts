/// <reference path="../../oauth.globals.ts"/>

namespace GoogleOAuth {
  export const pluginName = 'hawtio-oauth-google';
  export const log: Logging.Logger = Logger.get(pluginName);

  // Keep this unset unless we have a token
  export let userProfile: any = null;
}
