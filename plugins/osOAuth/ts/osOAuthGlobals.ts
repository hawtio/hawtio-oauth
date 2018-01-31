/// <reference path="../../includes.ts"/>

namespace OSOAuth {
  export const pluginName = 'hawtio-oauth-os';
  export const log: Logging.Logger = Logger.get(pluginName);
  // Keep this unset unless we have a token
  export let userProfile: any = null;

}
