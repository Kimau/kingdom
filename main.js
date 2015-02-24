var hackScope;
var myToken = 111;

/* Config */
var kingdomApp = angular.module('kingdomApp', [
  'ngRoute',
  'ngSanitize',
  'ngGlue',
  'kingdomControllers'
]);

kingdomApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/game/:ID', {
        templateUrl: '_game.html',
        controller: 'MyGameController'
      }).
      when('/', {
        templateUrl: '_menu.html',
        controller: 'MyMenuController'
      }).
      otherwise({
        redirectTo: '/'
      });
  }]);

/* Controllers */

var kingdomControllers = angular.module('kingdomControllers', []);

kingdomControllers.controller('MyMenuController', ['$scope', '$http',
  function($scope, $http) {
    hackScope = $scope;

    $scope.menuButtons = [
      {name:"Login"},
      {name:"Register"},
      {name:"Help"}];
  }]);

kingdomControllers.controller('MyGameController', ['$scope', '$http', '$rootScope', '$routeParams',
  function($scope, $http, $rootScope, $routeParams) {
    hackScope = $scope;
    $scope.echo = true;
    $scope.gameID = $routeParams.ID;

    $scope.msgs = [];

    $scope.processResponse = function(status, data) {

      switch(data.type) {
        case "login": myToken = data.token;
      }

      $scope.msgs.push(data);
    };

    $scope.submitCommand = function() {
      console.log($scope.cmdInputText);
      if($scope.echo)
        $scope.msgs.push({ content: ">" + $scope.cmdInputText});
      server.submitCommand($scope.cmdInputText, myToken, $scope.processResponse);
      $scope.cmdInputText = "";
    };

  }]);
