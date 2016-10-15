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
class NotificationService {
  constructor ($mdToast) {
    'ngInject';

    this.show = function (message, isError) {
      $mdToast.show(
        $mdToast.simple()
          .content(message.statusText || message)
          .position('bottom right')
          .hideDelay(3000)
          .theme(isError ? 'toast-error' : 'toast-success')
      );
    };

    this.showError = function (error, message) {
      this.show(message || (
        error.data ?
          Array.isArray(error.data) ?
            error.data[0].message
            : (error.data.message || error.data)
          : error
        ), true);
    };
  }
}

export default NotificationService;
