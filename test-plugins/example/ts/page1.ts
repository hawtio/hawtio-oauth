/// <reference path="examplePlugin.ts"/>
module Example {

  export var Page1Controller = _module.controller("Example.Page1Controller", ['$scope', 'userDetails', ($scope, userDetails) => {
    log.debug("userDetails: ", userDetails);
    $scope.userDetails = userDetails;
    $scope.userDetailsStr = angular.toJson(userDetails, true);
    $scope.target = "World!";
  }]);

  export var Page2Controller = _module.controller("Example.Page2Controller", ['$scope', ($scope) => {

  }]);

}
