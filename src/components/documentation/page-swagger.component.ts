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

import * as _ from 'lodash';
import UserService from '../../services/user.service';

const PageSwaggerComponent: ng.IComponentOptions = {
  template: require('./page-swagger.html'),
  bindings: {
    page: '<'
  },
  controller: function(Constants, UserService: UserService, $state: ng.ui.IStateService) {
    'ngInject';

    this.$onInit = function() {
      let pageId = (this.page === undefined) ? $state.params['pageId'] : this.page.id;
      if ($state.params['apiId']) {
        this.url = Constants.baseURL + 'apis/' + $state.params['apiId'] + '/pages/' + pageId + '/content';
      } else {
        this.url = Constants.baseURL + 'portal/pages/' + pageId + '/content';
      }
    };

    this.tryItEnabled = function() {
      return !_.isNil(this.page.configuration) && this.page.configuration.tryIt && UserService.isAuthenticated();
    };
  }
};

export default PageSwaggerComponent;
