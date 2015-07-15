/// <reference path="../../includes.ts"/>

module HawtioKeycloak {
  export var pluginName = 'hawtio-keycloak';
  export var log:Logging.Logger = Logger.get(pluginName);
  export var keycloak:any = undefined;

  // used by HawtioOAuth, must have a 'token' field when set, otherwise
  // leave undefined
  export var userProfile:any = undefined;
} 
