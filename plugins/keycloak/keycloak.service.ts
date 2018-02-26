namespace HawtioKeycloak {

  export class KeycloakService {

    constructor(
      public readonly enabled: boolean,
      public readonly keycloak: Keycloak.KeycloakInstance) {
    }

  }

}
