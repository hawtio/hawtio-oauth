/// <reference path="githubPlugin.ts"/>
module GithubOAuth {
  _module.component('githubPreferences', {
    template: `
    <p class="alert alert-success" ng-if="entity.accessToken && !entity.trying">
      Github access is already enabled, <a href="" ng-click="clearToken()">disable access</a>
    </p>
    <p ng-show="entity.trying">
      Please wait, trying...
    </p>
    <form ng-if="!entity.accessToken" class="form-horizontal">
      <p>Log into Github here to enable access to your Github organizations and repositories</p>
      <div class="form-group">
        <label class="col-sm-2 control-label" for="username">User Name</label>
        <div class="col-sm-10">
          <input class="form-control" id="username" type="text" ng-model="entity.username">
        </div>
      </div>
      <div class="form-group">
        <label class="col-sm-2 control-label" for="password">Password</label>
        <div class="col-sm-10">
          <input class="form-control" id="password" type="password" ng-model="entity.password">
        </div>
      </div>
      <button class="btn btn-success pull-right" ng-disabled="!entity.username && !entity.password" ng-click="login()">Log In</button>
    </form>
    `,
    controllerAs: 'github',
    controller: ['$scope', 'githubOAuthSettings', function GithubPreferenceController($scope, githubOAuthSettings) {
      var entity = $scope.entity = {
        trying: false,
        username: githubOAuthSettings.username,
        password: undefined,
        accessToken: githubOAuthSettings.authToken
      };
      var settings = $scope.settings = githubOAuthSettings;

      $scope.login = () => {
        console.log("Using: ", entity);
        $.ajax(settings.loginURL, <any>{
          method: 'GET',
          headers: {
            'Authorization': Core.getBasicAuthHeader(entity.username, entity.password)
          }
        });
      } 
    }]
  });
}

