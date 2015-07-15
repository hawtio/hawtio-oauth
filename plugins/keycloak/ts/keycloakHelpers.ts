/// <reference path="keycloakGlobals.ts"/>
module HawtioKeycloak {

  export function doLogout() {
    if (userProfile && keycloak) {
      keycloak.logout();
    }
  }

}
