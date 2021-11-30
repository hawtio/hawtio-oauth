/// <reference path="./login.globals.ts"/>
/// <reference path="../form.globals.ts"/>

namespace FormAuthLogin {

  const TOKEN_KEY = FormAuth.LOCAL_STORAGE_KEY_TOKEN;

  export class LoginController {
    branding: Core.Branding = { appName: '', appLogoUrl: '' };
    login: Core.Login = {};
    token: string;
    invalidToken: boolean = false;
    errorMessage: string;

    constructor(
      private configManager: Core.ConfigManager,
      private $http: ng.IHttpService,
      private $window: ng.IWindowService,
      private localStorage: Storage,
      private documentBase: string) {
      'ngInject';
    }

    $onInit(): void {
      this.branding = this.configManager.branding;
      this.login = this.configManager.login;
    }

    doLogin(): void {
      if (!this.token || this.token.trim() === '') {
        this.invalidToken = true;
        this.errorMessage = "Token is empty";
        return;
      }

      this.validateToken(() => {
        this.saveTokenAndRedirect();
      });
    }

    private validateToken(callback: () => void): void {
      log.debug("Fetching osconsole/config.js");
      $.getScript('osconsole/config.js')
        .always(() => {
          const masterUri: string = _.get(window, 'HAWTIO_OAUTH_CONFIG.master_uri');
          if (!masterUri) {
            log.error('Master URI is not found');
            this.invalidToken = true;
            this.errorMessage = "Cannot validate token";
            return;
          }

          this.$http
            .get(masterUri, {
              headers: {
                'Authorization': `Bearer ${this.token}`
              }
            })
            .then(
              (response: ng.IHttpResponse<any>) => {
                log.debug("Valid token:", response.data);
                callback();
              },
              (response: ng.IHttpResponse<any>) => {
                log.error('Invalid token', response);
                this.invalidToken = true;
                this.errorMessage = "Invalid token";
              });
        });

    }

    private saveTokenAndRedirect(): void {
      this.localStorage[TOKEN_KEY] = angular.toJson(this.token);
      const uri = this.redirectUri();
      log.debug("Redirecting:", uri);
      this.$window.location.href = uri;
    }

    private redirectUri(): string {
      const currentUri = new URI(this.$window.location.href);
      const query: any = currentUri.query(true);
      if (query.redirect_uri) {
        return query.redirect_uri;
      }
      return this.documentBase;
    }
  }

  export const loginComponent: angular.IComponentOptions = {
    controller: LoginController,
    templateUrl: 'plugins/form/login/login.component.html'
  };

}
