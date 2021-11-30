/// <reference path="./login.globals.ts"/>
/// <reference path="./login.component.ts"/>

namespace FormAuthLogin {

  export const loginModule = angular
    .module(pluginName, [])
    .component('hawtioOauthFormLogin', loginComponent)
    .name;

}
