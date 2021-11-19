namespace GithubOAuth {

  export function GithubPreferencesController($scope: any, githubOAuthSettings: any) {
    'ngInject';

    $scope.model = {
      trying: false,
      error: false,
      username: githubOAuthSettings.username,
      avatarURL: githubOAuthSettings.avatarURL,
      name: githubOAuthSettings.name,
      password: undefined,
      accessToken: githubOAuthSettings.accessToken,
      data: undefined
    };
    let model = $scope.model;
    $scope.settings = githubOAuthSettings;
    let settings = $scope.settings;

    $scope.disabled = () => {
      return Core.isBlank(model.username) || Core.isBlank(model.password);
    };

    let error = (data: any) => {
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
    };
  }
}

