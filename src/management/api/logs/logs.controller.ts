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
import _ = require('lodash');
import moment = require("moment");

import ApiService, { LogsQuery } from "../../../services/api.service";

class ApiLogsController {

  private api: any;
  private logs: {total: string; logs: any[], metadata: any};
  private query: LogsQuery;

  constructor(
    private ApiService: ApiService,
    private resolvedApi,
    private $scope,
    private $state: ng.ui.IStateService
  ) {
  'ngInject';
    this.ApiService = ApiService;
    this.$scope = $scope;
    this.api = resolvedApi.data;

    this.onPaginate = this.onPaginate.bind(this);

    this.query = new LogsQuery();
    this.query.size = 20;
    this.query.page = 1;
    this.query.from = this.$state.params['from'];
    this.query.to = this.$state.params['to'];
    this.query.query = this.$state.params['q'];
  }

  timeframeChange(timeframe) {
    this.query.from = timeframe.from;
    this.query.to = timeframe.to;
    this.query.page = 1;
    this.refresh();
  }

  onPaginate(page) {
    this.query.page = page;
    this.refresh();
  }

  selectLog(log) {
    console.log(log);
  }

  refresh() {
    this.ApiService.findLogs(this.api.id, this.query).then((logs) => {
      this.logs = logs.data;
    });
  }

  getMetadata(id) {
    return this.logs.metadata[id];
  }
}

export default ApiLogsController;
