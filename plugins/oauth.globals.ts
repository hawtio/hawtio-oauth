// variable for getting openshift oauth config from
declare let OSOAuthConfig: HawtioOAuth.OpenShiftConfig;
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

  export interface Config {
    master_uri: string;
    form?: FormConfig;
    openshift?: OpenShiftConfig;
    token?: string;
  }

  export interface FormConfig {
    uri: string;
  }

  export interface OpenShiftConfig {
    oauth_metadata_uri?: string;
    issuer?: string;
    oauth_authorize_uri: string;
    oauth_client_id: string;
    scope: string;
  }

}
