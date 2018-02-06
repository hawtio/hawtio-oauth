namespace Example {

  export function page2Controller($scope, GithubOAuth, HawtioPreferences) {
    'ngInject';

    let oauth = $scope.oauth = GithubOAuth;
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
  }

}
