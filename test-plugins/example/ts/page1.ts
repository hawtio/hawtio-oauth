/// <reference path="examplePlugin.ts"/>
namespace Example {

  export const Page1Controller = _module.controller("Example.Page1Controller", ['$scope', 'userDetails', (
    $scope, userDetails) => {
    log.debug("userDetails: ", userDetails);
    $scope.userDetails = userDetails;
    $scope.userDetailsStr = angular.toJson(userDetails, true);
    $scope.target = "World!";
  }]);

}
