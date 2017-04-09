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
var _ = require("lodash");
var Highcharts = require("highcharts");
var angular = require("angular");
var ChartDirective = (function () {
    function ChartDirective() {
        'ngInject';
        return {
            restrict: 'E',
            template: '<div></div>',
            scope: {
                options: '=',
                type: '@',
                zoom: '=',
                height: '=',
                width: '='
            },
            controller: ChartController,
            link: function (scope, element, attributes, controller) {
                var chartElement = element[0];
                if (scope.type && scope.type.startsWith('area')) {
                    initSynchronizedCharts();
                }
                var lastOptions;
                scope.$watch('options', function (newOptions) {
                    setTimeout(function () {
                        displayChart(newOptions, chartElement);
                        lastOptions = newOptions;
                    });
                });
                function onWindowResized() {
                    setTimeout(function () {
                        onResize();
                    }, 500);
                }
                angular.element(controller.$window).bind('resize', function () {
                    onWindowResized();
                });
                scope.$root.$watch('reducedMode', function (reducedMode) {
                    if (reducedMode !== undefined && lastOptions) {
                        onWindowResized();
                    }
                });
                scope.$on('onWidgetResize', function () {
                    setTimeout(function () {
                        onResize();
                    });
                });
                function onResize() {
                    displayChart(lastOptions, chartElement);
                }
                // function setChartSize() {
                //   let containerElement = element.parent().parent().parent().parent()[0];
                //   let parentElement = element.parent()[0];
                //   element.css('height', scope.height || parentElement.clientHeight || containerElement.clientHeight);
                //   element.css('width', scope.width || parentElement.clientWidth || containerElement.clientWidth);
                // }
                function initSynchronizedCharts() {
                    element.bind('mousemove touchmove touchstart', function (e) {
                        var chart, i, event, points;
                        for (i = 0; i < Highcharts.charts.length; i++) {
                            chart = Highcharts.charts[i];
                            if (chart) {
                                if (e.originalEvent) {
                                    event = chart.pointer.normalize(e.originalEvent);
                                }
                                else {
                                    event = chart.pointer.normalize(e);
                                }
                                points = _.map(chart.series, function (serie) {
                                    return serie.searchPoint(event, true);
                                });
                                points = _.filter(points, function (point) {
                                    return point;
                                });
                                e.points = points;
                                if (points.length && points[0] && points[0].series.area) {
                                    points[0].highlight(e);
                                }
                            }
                        }
                    });
                    Highcharts.Pointer.prototype.reset = function () {
                        var chart;
                        for (var i = 0; i < Highcharts.charts.length; i++) {
                            chart = Highcharts.charts[i];
                            if (chart) {
                                if (chart.tooltip) {
                                    chart.tooltip.hide(this);
                                }
                                if (chart.xAxis[0]) {
                                    chart.xAxis[0].hideCrosshair();
                                }
                            }
                        }
                    };
                    Highcharts.Point.prototype.highlight = function (event) {
                        if (event.points.length) {
                            this.onMouseOver();
                            this.series.chart.tooltip.refresh(event.points);
                            this.series.chart.xAxis[0].drawCrosshair(event, this);
                        }
                    };
                }
                function displayChart(newOptions, chartElement) {
                    if (newOptions) {
                        newOptions = _.merge(newOptions, {
                            lang: {
                                noData: '<code>No data to display</code>'
                            },
                            noData: {
                                useHTML: true
                            }
                        });
                        if (newOptions.title) {
                            newOptions.title.style = {
                                'fontWeight': 'bold',
                                'fontSize': '12px',
                                'fontFamily': '"Helvetica Neue",Helvetica,Arial,sans-serif'
                            };
                            newOptions.title.align = 'left';
                        }
                        else {
                            newOptions.title = { text: '' };
                        }
                        newOptions.yAxis = _.merge(newOptions.yAxis, { title: { text: '' } });
                        var containerElement = element.parent().parent()[0];
                        var parentElement = element.parent()[0];
                        newOptions.chart = _.merge(newOptions.chart, { type: scope.type,
                            height: scope.height || parentElement.height || containerElement.height,
                            width: scope.width || parentElement.clientWidth || containerElement.clientWidth
                        });
                        if (scope.zoom) {
                            newOptions.chart.zoomType = 'x';
                        }
                        newOptions.credits = {
                            enabled: false
                        };
                        newOptions.series = _.sortBy(newOptions.series, 'name');
                        _.forEach(newOptions.series, function (serie) {
                            serie.data = _.sortBy(serie.data, 'name');
                        });
                        if (scope.type && scope.type.startsWith('area')) {
                            newOptions.tooltip = {
                                formatter: function () {
                                    //TODO: check this
                                    //let s = '<b>' + Highcharts.dateFormat('%A, %b %d, %H:%M', new Date(this.x)) + '</b>';
                                    var s = '<b>' + Highcharts.dateFormat('%A, %b %d, %H:%M', this.x) + '</b>';
                                    if (_.filter(this.points, function (point) {
                                        return point.y !== 0;
                                    }).length) {
                                        _.forEach(this.points, function (point) {
                                            if (point.y) {
                                                var name_1 = ' ' + (point.series.options.labelPrefix ? point.series.options.labelPrefix + ' ' + point.series.name : point.series.name);
                                                s += '<br /><span style="color:' + point.color + '">\u25CF</span>' + name_1 + ': <b>' + point.y + '</b>';
                                            }
                                        });
                                    }
                                    return s;
                                },
                                headerFormat: '<b>{point.key}</b><br/>',
                                shared: true
                            };
                            newOptions.plotOptions = _.merge(newOptions.plotOptions, {
                                series: {
                                    marker: {
                                        enabled: false
                                    },
                                    fillOpacity: 0.1
                                }
                            });
                            if (scope.type && scope.type.startsWith('area')) {
                                newOptions.xAxis = _.merge(newOptions.xAxis, { crosshair: true });
                            }
                        }
                        else if (scope.type && scope.type === 'solidgauge') {
                            newOptions = _.merge(newOptions, {
                                pane: {
                                    background: {
                                        innerRadius: '80%',
                                        outerRadius: '100%'
                                    }
                                },
                                tooltip: {
                                    enabled: false
                                },
                                yAxis: {
                                    showFirstLabel: false,
                                    showLastLabel: false,
                                    min: 0,
                                    max: 100,
                                    stops: [
                                        [0.1, '#55BF3B'],
                                        [0.5, '#DDDF0D'],
                                        [0.9, '#DF5353'] // red
                                    ],
                                    minorTickInterval: null,
                                    tickAmount: 2
                                },
                                plotOptions: {
                                    solidgauge: {
                                        innerRadius: '80%',
                                        outerRadius: '100%',
                                        dataLabels: {
                                            y: 30,
                                            borderWidth: 0,
                                            useHTML: true
                                        }
                                    }
                                },
                                series: [{
                                        dataLabels: {
                                            format: '<div style="text-align:center">' +
                                                '<span style="font-size:25px;color:' +
                                                ((Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black') + '">{y}%</span><br/>' +
                                                '<span style="font-size:12px;color:silver;">' + newOptions.series[0].name + '</span>' +
                                                '</div>'
                                        }
                                    }]
                            });
                        }
                        else if (scope.type && scope.type === 'column') {
                            if (scope.stacked) {
                                newOptions.plotOptions = {
                                    column: {
                                        stacking: 'normal'
                                    }
                                };
                            }
                        }
                        Highcharts.chart(chartElement, newOptions);
                    }
                }
            }
        };
    }
    return ChartDirective;
}());
var ChartController = (function () {
    function ChartController($window) {
        'ngInject';
        this.$window = $window;
    }
    return ChartController;
}());
exports.default = ChartDirective;
