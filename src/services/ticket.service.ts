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

export class TicketsQuery {
  page: number;
  size: number;
  order: string;
}

class TicketService {
  private ticketURL: string;

  constructor(private $http, private Constants) {
    'ngInject';
    this.ticketURL = `${Constants.envBaseURL}/platform/tickets`;
  }

  create(ticket) {
    if (ticket) {
      return this.$http.post(this.ticketURL, ticket);
    }
  }

  search(query: TicketsQuery) {
    return this.$http.get(this.buildURLWithQuery(query, this.ticketURL + '?'));
  }

  getTicket(ticketId: string) {
    return this.$http.get(`${this.ticketURL}/${ticketId}`);
  }

  private buildURLWithQuery(query: TicketsQuery, url) {
    var keys = Object.keys(query);
    _.forEach(keys, function (key) {
      var val = query[key];
      if (val !== undefined && val !== '') {
        url += key + '=' + val + '&';
      }
    });
    return url;
  }
}

export default TicketService;
