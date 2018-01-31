/// <reference path="githubPlugin.ts"/>
namespace GithubOAuth {
  _module.component('githubPreferences', {
    template: `
    <div class="alert alert-success" role="alert" ng-if="model.accessToken && !model.trying">
      <p><img style="width: 64px; height: 64px;" ng-src="{{model.avatarURL}}">&nbsp;Logged in as <strong>{{model.name}}</strong>, <a href="" ng-click="check()">Check access</a><strong ng-if="model.data.app.name">&nbsp;<i class="fa fa-check green"></i></strong></p>
      <p>Github access is enabled, <a href="" ng-click="clearToken()">disable access</a></p>
    </div>
    <div class="alert alert-warning" role="alert" ng-if="model.error">
      <button type="button" class="close" ng-click="model.error = false" aria-label="Close"><span aria-hidden="true">&times;</span></button>
      Error logging in: {{model.data.statusText}} - {{model.data.responseJSON.message}}
    </div>
    <div class="alert alert-info" ng-show="model.trying">
      <div class="align-center">
        <div class="spinner spinner-lg"></div>
      </div>
    </div>
    <form ng-if="!model.accessToken" class="form-horizontal">
      <p>Log into Github here to enable access to your Github organizations and repositories</p>
      <div class="form-group">
        <label class="col-sm-2 control-label" for="username">User Name</label>
        <div class="col-sm-10">
          <input class="form-control" id="username" type="text" ng-model="model.username">
        </div>
      </div>
      <div class="form-group">
        <label class="col-sm-2 control-label" for="password">Password</label>
        <div class="col-sm-10">
          <input class="form-control" id="password" type="password" ng-model="model.password">
        </div>
      </div>
      <button class="btn btn-success pull-right" ng-disabled="disabled()" ng-click="login()">Log In</button>
    </form>
    <!-- <pre>{{model | json}}</pre> -->
    `,
    controllerAs: 'github',
    controller: ['$scope', 'githubOAuthSettings', function GithubPreferenceController($scope, githubOAuthSettings) {
      let model = $scope.model = {
        trying: false,
        error: false,
        username: githubOAuthSettings.username,
        avatarURL: githubOAuthSettings.avatarURL,
        name: githubOAuthSettings.name,
        password: undefined,
        accessToken: githubOAuthSettings.accessToken,
        data: undefined
      };
      let settings = $scope.settings = githubOAuthSettings;

      $scope.disabled = () => {
        return Core.isBlank(model.username) || Core.isBlank(model.password);
      };

      let error = (data) => {
        model.trying = false;
        model.error = true;
        model.data = data;
        Core.$apply($scope);
      };

      $scope.clearToken = () => {
        model.trying = true;
        $.ajax(getTokenCheckAuthURL(githubOAuthSettings), <any>{
          method: 'DELETE',
          headers: {
            'Authorization': getTokenCheckAuthHeader(githubOAuthSettings)
          },
          success: (data) => {
            model.trying = false;
            model.data = data;
            model.accessToken = undefined;
            model.name = undefined;
            model.avatarURL = undefined;
            storeSettings(model, githubOAuthSettings);
            Core.$apply($scope);
          },
          error: error,
          beforeSend: emptyBeforeSend
        });
      };

      $scope.check = () => {
        model.trying = true;
        $.ajax(getTokenCheckAuthURL(githubOAuthSettings), <any>{
          method: 'GET',
          headers: {
            'Authorization': getTokenCheckAuthHeader(githubOAuthSettings)
          },
          success: (data) => {
            model.trying = false;
            model.data = data;
            Core.$apply($scope);
          },
          error: (data) => {
            model.accessToken = undefined;
            model.name = undefined;
            model.avatarURL = undefined;
            storeSettings(model, githubOAuthSettings);
            error(data);
          },
          beforeSend: emptyBeforeSend
        });
      };

      $scope.login = () => {
        model.error = false;
        model.trying = true;
        let headers = {
          'Authorization': Core.getBasicAuthHeader(model.username, model.password)
        };
        storeSettings(model, githubOAuthSettings);
        $.ajax(settings.loginURL, <any>{
          method: 'GET',
          headers: headers,
          success: (data) => {
            model.name = data.name;
            model.avatarURL = data.avatar_url;
            $.ajax(settings.tokenURL, <any>{
              method: 'POST',
              contentType: 'application/json; charset=UTF-8',
              mimeType: 'application/json',
              dataType: 'json',
              processData: false,
              data: angular.toJson({
                client_id: githubOAuthSettings.clientId,
                client_secret: githubOAuthSettings.clientSecret,
                note: 'hawtio console access token',
                scopes: githubOAuthSettings.scopes
              }),
              headers: headers,
              success: (data) => {
                model.trying = false;
                model.accessToken = data.token;
                delete model.password;
                storeSettings(model, githubOAuthSettings);
                Core.$apply($scope);
              },
              error: error,
              beforeSend: emptyBeforeSend
            });
          },
          error: error,
          beforeSend: emptyBeforeSend
        });
      }
    }]
  });
}

