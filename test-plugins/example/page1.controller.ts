namespace Example {

  export function page1Controller($scope, userDetails: Core.UserDetails): void {
    'ngInject';
    log.debug("userDetails:", userDetails);
    $scope.userDetails = angular.toJson({
      username: userDetails.username,
      password: '********',
      token: userDetails.token
    }, true);
  }

}
