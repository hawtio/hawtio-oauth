/// <reference path="../../includes.ts"/>

namespace GoogleOAuth {
  export var pluginName = 'hawtio-google-oauth';
  export var log:Logging.Logger = Logger.get(pluginName);

  // Keep this unset unless we have a token
  export var userProfile:any = null;
}
