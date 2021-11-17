// variable for getting openshift oauth config from
declare let OSOAuthConfig: any;
declare let GoogleOAuthConfig: any;

// variable set by server script that contains oauth settings
declare let HAWTIO_OAUTH_CONFIG: any;

namespace HawtioOAuth {

  export const pluginName = 'hawtio-oauth';
  export const log: Logging.Logger = Logger.get(pluginName);

  export const oauthPlugins: string[] = [];

  export type UserProfile = {
    token?: string;
  };

}
