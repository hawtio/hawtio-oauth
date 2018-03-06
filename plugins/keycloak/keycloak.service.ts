namespace HawtioKeycloak {

  const TOKEN_UPDATE_INTERVAL = 5; // 5 sec.

  export class KeycloakService {

    constructor(
      public readonly enabled: boolean,
      public readonly keycloak: Keycloak.KeycloakInstance) {
    }

    updateToken(onSuccess: (token: string) => void, onError?: () => void): void {
      this.keycloak.updateToken(TOKEN_UPDATE_INTERVAL)
        .success(() => {
          let token = this.keycloak.token;
          onSuccess(token);
        })
        .error(() => {
          log.error("Couldn't update token");
          if (onError) {
            onError();
          }
        });
    }

  }

}
