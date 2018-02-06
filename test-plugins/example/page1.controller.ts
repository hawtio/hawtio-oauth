namespace Example {

  export function page1Controller($scope, userDetails) {
    'ngInject';
    log.debug("userDetails: ", userDetails);
    $scope.userDetails = userDetails;
    $scope.userDetailsStr = angular.toJson(userDetails, true);
    $scope.target = "World!";
  }

}
