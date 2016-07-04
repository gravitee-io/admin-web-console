/*
 * Copyright (C) 2015 The Gravitee team (http://gravitee.io)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class SideNavDirective {
  constructor() {
    let directive = {
      restrict: 'E',
      templateUrl: 'app/components/sidenav/sidenav.html',
      controller: SideNavController,
      controllerAs: 'sidenavCtrl',
      bindToController: true
    };

    return directive;
  }
}

class SideNavController {
  constructor($rootScope, $mdSidenav, $mdDialog, $scope, $state, UserService, Constants, $window) {
    'ngInject';
    this.$rootScope = $rootScope;
    this.$mdSidenav = $mdSidenav;
    this.$mdDialog = $mdDialog;
    this.UserService = UserService;
    this.$state = $state;
    this.Constants = Constants;
    this.$window = $window;

    var _that = this;

    this.routeMenuItems = _.filter($state.get(), function (state) {
      return !state.abstract && state.menu;
    });

    _that.loadMenuItems($scope, UserService);

    $scope.$on('userLoginSuccessful', function () {
      _that.loadMenuItems($scope, UserService);
    });

    $scope.$on('$stateChangeStart', function (event, toState, toParams, fromState) {
      // init current resource name to delegate its initialization to specific modules
      if (fromState.name.substring(0, _.lastIndexOf(fromState.name, '.')) !==
        toState.name.substring(0, _.lastIndexOf(toState.name, '.'))) {
        delete $scope.currentResource;
      }
    });

    $scope.$on('$stateChangeSuccess', function (event, toState) {
      $scope.subMenuItems = _.filter(_that.routeMenuItems, function (routeMenuItem) {
        var routeMenuItemSplitted = routeMenuItem.name.split('.'), toStateSplitted = toState.name.split('.');
        return !routeMenuItem.menu.firstLevel &&
          routeMenuItemSplitted[0] === toStateSplitted[0] && routeMenuItemSplitted[1] === toStateSplitted[1];
      });
    });

    $scope.$on('authenticationRequired', function () {
      _that.login();
    });
  }

  loadMenuItems($scope, UserService) {
    $scope.menuItems = _.filter(this.routeMenuItems, function (routeMenuItem) {
      return routeMenuItem.menu.firstLevel && (!routeMenuItem.roles || UserService.isUserInRoles(routeMenuItem.roles));
    });
  }

  close() {
    this.$mdSidenav('left').close();
  }

  login() {
    if (this.Constants.securityType !== 'oauth2') {
      this.$state.go('login');
    } else {
      var oauth2ServerBaseURL = this.Constants.oauth2ServerURL;
      var oauth2ClientId = this.Constants.oauth2ClientId;
      var oauth2RedirectURI =  this.$window.location.origin;
      var oauth2GrantFlow = 'authorize?response_type=token';
      var oauth2AuthorizationEndPoint = oauth2ServerBaseURL + '/oauth/' + oauth2GrantFlow  + '&client_id=' + oauth2ClientId + '&redirect_uri=' + oauth2RedirectURI;
      this.$window.location.href = oauth2AuthorizationEndPoint;
    }
  }

  logout() {
    var that = this;
    this.UserService.logout().then(function () {
      that.$rootScope.$broadcast('graviteeLogout');
    })
  }

  isDisplayed() {
    return 'login' !== this.$state.current.name;
  }

  goToUserPage() {
    this.$state.go(this.$rootScope.graviteeUser?'user':'home');
  }
}

export default SideNavDirective;
