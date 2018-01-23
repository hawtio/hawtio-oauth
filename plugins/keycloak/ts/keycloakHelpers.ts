/// <reference path="keycloakGlobals.ts"/>
namespace HawtioKeycloak {

  export function doLogout() {
    if (userProfile && keycloak) {
      keycloak.logout();
    }
  }

}
