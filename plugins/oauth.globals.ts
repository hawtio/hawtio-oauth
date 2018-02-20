// variable for getting openshift oauth config from
declare let OSOAuthConfig;
declare let GoogleOAuthConfig;

// variable set by server script that contains oauth settings
declare let HAWTIO_OAUTH_CONFIG;

namespace HawtioOAuth {

  export const pluginName = 'hawtio-oauth';
  export const log: Logging.Logger = Logger.get(pluginName);

  export const oauthPlugins: string[] = [];

}
