"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
var moment = require("moment");
var _ = require("lodash");
var angular = require("angular");
var ApiHealthCheckController = (function () {
    function ApiHealthCheckController(ApiService, resolvedApi, $state, $mdSidenav, $mdDialog, NotificationService, $scope, $rootScope) {
        'ngInject';
        this.ApiService = ApiService;
        this.resolvedApi = resolvedApi;
        this.$state = $state;
        this.$mdSidenav = $mdSidenav;
        this.$mdDialog = $mdDialog;
        this.NotificationService = NotificationService;
        this.$scope = $scope;
        this.$rootScope = $rootScope;
        this.api = resolvedApi.data;
        this.healthcheck = this.api.services && this.api.services['health-check'];
        this.timeUnits = ['SECONDS', 'MINUTES', 'HOURS'];
        this.httpMethods = ['GET', 'POST', 'PUT'];
        this.hasData = false;
        this.analytics = this._analytics();
        this.setTimeframe('1h');
        $scope.options = {
            elements: {
                point: {
                    radius: 5
                }
            },
            scales: {
                xAxes: [{
                        display: true,
                        stacked: true
                    }],
                yAxes: [{
                        stacked: true
                    }]
            },
            tooltips: {
                mode: 'label'
            },
            // Sets the chart to be responsive
            responsive: true,
            //Boolean - Whether the scale should start at zero, or an order of magnitude down from the lowest value
            scaleBeginAtZero: true,
            //Boolean - Whether grid lines are shown across the chart
            scaleShowGridLines: true,
            //String - Colour of the grid lines
            scaleGridLineColor: "rgba(0,0,0,.05)",
            //Number - Width of the grid lines
            scaleGridLineWidth: 1,
            //Boolean - If there is a stroke on each bar
            barShowStroke: true,
            //Number - Pixel width of the bar stroke
            barStrokeWidth: 2,
            //Number - Spacing between each of the X value sets
            barValueSpacing: 5,
            //Number - Spacing between data sets within X values
            barDatasetSpacing: 1,
            //String - A legend template
            legendTemplate: '<ul class="tc-chart-js-legend"><% for (var i=0; i<datasets.length; i++){%><li><span style="background-color:<%=datasets[i].fillColor%>"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>'
        };
        // Chart.js Options
        $scope.doughnutOptions = {
            // Sets the chart to be responsive
            responsive: true,
            //Boolean - Whether we should show a stroke on each segment
            segmentShowStroke: true,
            //String - The colour of each segment stroke
            segmentStrokeColor: '#fff',
            //Number - The width of each segment stroke
            segmentStrokeWidth: 2,
            //Number - The percentage of the chart that we cut out of the middle
            percentageInnerCutout: 50,
            //Number - Amount of animation steps
            animationSteps: 100,
            //String - Animation easing effect
            animationEasing: 'easeOutBounce',
            //Boolean - Whether we animate the rotation of the Doughnut
            animateRotate: true,
            //Boolean - Whether we animate scaling the Doughnut from the centre
            animateScale: false,
        };
        $scope.doughnut = {};
        $scope.chartData = [];
        this.initState();
        this.updateChart();
    }
    ApiHealthCheckController.prototype.initState = function () {
        if (this.healthcheck !== undefined) {
            this.$scope.healthCheckEnabled = this.healthcheck.enabled;
        }
        else {
            this.$scope.healthCheckEnabled = false;
        }
        if (this.healthcheck === undefined) {
            this.healthcheck = {};
        }
        if (this.healthcheck.request === undefined) {
            this.healthcheck.request = {};
        }
        if (this.healthcheck.expectation === undefined) {
            this.healthcheck.expectation = {};
        }
        if (this.healthcheck.request.headers === undefined) {
            this.healthcheck.request.headers = [
                { name: '', value: '' }
            ];
        }
        if (this.healthcheck.expectation.assertions === undefined) {
            this.healthcheck.expectation.assertions = [];
        }
    };
    ApiHealthCheckController.prototype.switchEnabled = function () {
        if (this.healthcheck === undefined) {
            this.healthcheck = {};
        }
        this.healthcheck.enabled = this.$scope.healthCheckEnabled;
        this.update();
    };
    ApiHealthCheckController.prototype.toggleRight = function () {
        this.$mdSidenav('healthcheck-config').toggle();
    };
    ApiHealthCheckController.prototype.close = function () {
        this.$mdSidenav('healthcheck-config').close();
    };
    ApiHealthCheckController.prototype.openMenu = function ($mdOpenMenu, ev) {
        $mdOpenMenu(ev);
    };
    ApiHealthCheckController.prototype.addHTTPHeader = function () {
        if (this.healthcheck.request.headers === undefined) {
            this.healthcheck.request.headers = [];
        }
        this.healthcheck.request.headers.push({ name: '', value: '' });
    };
    ApiHealthCheckController.prototype.removeHTTPHeader = function (idx) {
        if (this.healthcheck.request.headers !== undefined) {
            this.healthcheck.request.headers.splice(idx, 1);
        }
    };
    ApiHealthCheckController.prototype.addAssertion = function () {
        if (this.healthcheck.expectation === undefined) {
            this.healthcheck.expectation = {
                assertions: ['']
            };
        }
        else {
            this.healthcheck.expectation.assertions.push('');
        }
    };
    ApiHealthCheckController.prototype.removeAssertion = function (idx) {
        if (this.healthcheck.expectation !== undefined) {
            this.healthcheck.expectation.assertions.splice(idx, 1);
        }
    };
    ApiHealthCheckController.prototype.updateTimeframe = function (timeframeId) {
        this.setTimeframe(timeframeId);
        this.updateChart();
    };
    ApiHealthCheckController.prototype.showAssertionInformation = function () {
        this.$mdDialog.show({
            controller: 'DialogAssertionInformationController',
            controllerAs: 'ctrl',
            template: require('./assertion.dialog.html'),
            parent: angular.element(document.body),
            clickOutsideToClose: true
        });
    };
    ApiHealthCheckController.prototype.setTimeframe = function (timeframeId) {
        var timeframe = _.find(this.analytics.timeframes, function (timeframe) {
            return timeframe.id === timeframeId;
        });
        var now = moment();
        this.$scope.analytics = {
            timeframe: timeframe,
            range: {
                interval: timeframe.interval,
                from: now - timeframe.range,
                to: now,
                fromMoment: moment(now - timeframe.range).format("dddd, MMMM Do YYYY, h:mm:ss a"),
                toMoment: moment(now).format("dddd, MMMM Do YYYY, h:mm:ss a")
            }
        };
    };
    ApiHealthCheckController.prototype.update = function () {
        var _this = this;
        this.api.services['health-check'] = this.healthcheck;
        this.ApiService.update(this.api).then(function (updatedApi) {
            _this.api = updatedApi.data;
            _this.close();
            _this.$scope.formApiHealthCheck.$setPristine();
            _this.$rootScope.$broadcast('apiChangeSuccess');
        });
    };
    ApiHealthCheckController.prototype.updateChart = function () {
        var _this = this;
        this.ApiService.apiHealth(_this.api.id, _this.$scope.analytics.range.interval, _this.$scope.analytics.range.from, _this.$scope.analytics.range.to).then(function (response) {
            _this.$scope.hasData = !(_.isEmpty(response.data.buckets));
            _this.$scope.chartData = {
                xAxis: {
                    categories: _.map(response.data.timestamps, function (timestamp) {
                        return moment(timestamp).format("YYYY-MM-DD HH:mm:ss");
                    })
                },
                series: []
            };
            var okCounter = 0;
            if (response.data.buckets && response.data.buckets.true) {
                _this.$scope.chartData.series.push({
                    data: response.data.buckets.true,
                    name: "OK",
                    fillColor: '#a5d6a7',
                    color: '#66bb6a'
                });
                _.forEach(response.data.buckets.true, function (value) {
                    okCounter += value;
                });
            }
            var koCounter = 0;
            if (response.data.buckets && response.data.buckets.false) {
                _this.$scope.chartData.series.push({
                    data: response.data.buckets.false,
                    name: "KO",
                    fillColor: '#ef9a9a',
                    color: '#ef5350'
                });
                _.forEach(response.data.buckets.false, function (value) {
                    koCounter += value;
                });
            }
            _this.$scope.doughnut = {
                series: [{
                        name: "Healthcheck repartition",
                        data: [
                            { y: koCounter, name: 'KO', color: '#ef9a9a' },
                            { y: okCounter, name: 'OK', color: '#a5d6a7' }
                        ]
                    }]
            };
        });
    };
    ApiHealthCheckController.prototype._analytics = function () {
        return {
            timeframes: [
                {
                    id: '5m',
                    title: 'Last 5 minutes',
                    range: 1000 * 60 * 5,
                    interval: 10000
                }, {
                    id: '1h',
                    title: 'Last hour',
                    range: 1000 * 60 * 60,
                    interval: 1000 * 60
                }, {
                    id: '24h',
                    title: 'Last 24 hours',
                    range: 1000 * 60 * 60 * 24,
                    interval: 1000 * 60 * 60
                }, {
                    id: '3d',
                    title: 'Last 3 days',
                    range: 1000 * 60 * 60 * 24 * 3,
                    interval: 1000 * 60 * 60 * 3
                }, {
                    id: '14d',
                    title: 'Last 14 days',
                    range: 1000 * 60 * 60 * 24 * 14,
                    interval: 1000 * 60 * 60 * 5
                }, {
                    id: '30d',
                    title: 'Last 30 days',
                    range: 1000 * 60 * 60 * 24 * 30,
                    interval: 10000000
                }, {
                    id: '90d',
                    title: 'Last 90 days',
                    range: 1000 * 60 * 60 * 24 * 90,
                    interval: 10000000
                }
            ]
        };
    };
    return ApiHealthCheckController;
}());
exports.default = ApiHealthCheckController;
