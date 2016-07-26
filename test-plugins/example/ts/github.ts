/// <reference path="examplePlugin.ts"/>
module Example {

  export var Page2Controller = _module.controller("Example.Page2Controller", ['$scope', 'GithubOAuth', 'HawtioPreferences', ($scope, GithubOAuth, HawtioPreferences) => {
    var oauth = $scope.oauth = GithubOAuth;
    $scope.prefs = HawtioPreferences;

    if (oauth.hasToken()) {
      $.ajax('https://api.github.com/user/orgs', <any>{
        method: 'GET',
        headers: {
          'Authorization': oauth.getHeader(),
        },
        success: (data) => {
          $scope.data = data;
        },
        error: (data) => {
          $scope.data = data;
        },
        complete: () => {
          Core.$apply($scope);
        },
        beforeSend: GithubOAuth.emptyBeforeSend
      });
    }
  }]);

}
