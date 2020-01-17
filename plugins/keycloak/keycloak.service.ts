namespace HawtioKeycloak {

  const TOKEN_UPDATE_INTERVAL = 5; // 5 sec.

  export class KeycloakService {

    constructor(
      public readonly enabled: boolean,
      public readonly keycloak: Keycloak.KeycloakInstance,
      private readonly jaas: boolean,
      private readonly $cookies) {
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

    setupJQueryAjax(userDetails: Core.AuthService): void {
      log.debug("Setting authorization header to token");
      $.ajaxSetup({
        beforeSend: (xhr: JQueryXHR, settings: JQueryAjaxSettings) => {
          if (this.keycloak.authenticated && !this.keycloak.isTokenExpired(TOKEN_UPDATE_INTERVAL)) {
            if (this.jaas) {
              // use BearerTokenLoginModule on server side
              xhr.setRequestHeader('Authorization', Core.getBasicAuthHeader(keycloak.profile.username, keycloak.token));
            } else {
              // otherwise bearer token is used
              xhr.setRequestHeader('Authorization', 'Bearer ' + keycloak.token);
            }
            // For CSRF protection with Spring Security
            if (this.$cookies.get('XSRF-TOKEN')) {
              log.debug("Setting XSRF token header from cookies");
              xhr.setRequestHeader('X-XSRF-TOKEN', this.$cookies.get('XSRF-TOKEN'));
            }
          } else {
            log.debug("Skipped request", settings.url, "for now.");
            this.updateToken(
              (token) => {
                if (token) {
                  log.debug('Keycloak token refreshed. Set new value to userDetails');
                  userDetails.token = token;
                }
                log.debug("Re-sending request after successfully update keycloak token:", settings.url);
                $.ajax(settings);
              },
              () => userDetails.logout());
            return false;
          }
        }
      });
    }

  }

}
