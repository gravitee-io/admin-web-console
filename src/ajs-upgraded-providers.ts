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

/**
 * Provider to temporarily ensure compatibility between AngularJs and Angular
 */
import { InjectionToken } from '@angular/core';

export const UIRouterState = new InjectionToken('UIRouterState');

function uiRouterStateServiceFactory(i: any) {
  return i.get('$state');
}
export const uiRouterStateProvider = {
  provide: UIRouterState,
  useFactory: uiRouterStateServiceFactory,
  deps: ['$injector'],
};

export const UIRouterStateParams = new InjectionToken('UIRouterStateParams');

function uiRouterStateParamsServiceFactory(i: any) {
  return i.get('$stateParams');
}
export const uiRouterStateParamsProvider = {
  provide: UIRouterStateParams,
  useFactory: uiRouterStateParamsServiceFactory,
  deps: ['$injector'],
};
