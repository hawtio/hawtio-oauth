/// <reference path="../../includes.ts"/>

module HawtioKeycloak {
  export var pluginName = 'hawtio-keycloak';
  export var log:Logging.Logger = Logger.get(pluginName);
  export var keycloak:any = undefined;
  export var userProfile:any = undefined;
} 
