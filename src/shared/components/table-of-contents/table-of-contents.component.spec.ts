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
import { LocationStrategy } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { camelCase } from 'lodash';
import { MockLocationStrategy } from '@angular/common/testing';

import { TocSectionLink } from './TocSection';
import { TableOfContentsComponent } from './table-of-contents.component';
import { TableOfContentsModule } from './table-of-contents.module';
import { TableOfContentsService } from './table-of-contents.service';

describe('GioConfirmDialogComponent', () => {
  let component: TableOfContentsComponent;
  let fixture: ComponentFixture<TableOfContentsComponent>;
  let tableOfContentsService: TableOfContentsService;
  let locationStrategy: MockLocationStrategy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TableOfContentsModule],
      providers: [{ provide: LocationStrategy, useClass: MockLocationStrategy }],
    });
    fixture = TestBed.createComponent(TableOfContentsComponent);
    component = fixture.componentInstance;

    tableOfContentsService = TestBed.inject(TableOfContentsService);
    locationStrategy = TestBed.inject(LocationStrategy) as MockLocationStrategy;
    fixture.nativeElement.getBoundingClientRect = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should display section with links dynamically', () => {
    fixture.detectChanges();
    tableOfContentsService.addLink('', fakeLink({ name: '1️⃣' }));
    tableOfContentsService.addLink('', fakeLink({ name: '2️⃣' }));
    fixture.detectChanges();

    expect(getLinksText()).toEqual(['1️⃣', '2️⃣']);

    tableOfContentsService.addLink('', fakeLink({ name: '3️⃣' }));
    fixture.detectChanges();

    expect(getLinksText()).toEqual(['1️⃣', '2️⃣', '3️⃣']);
    expect(getSectionName()).toEqual(undefined);

    tableOfContentsService.addSection('', 'Section 🔢');
    fixture.detectChanges();

    expect(getSectionName()).toEqual('Section 🔢');
  });

  it('should active link on scroll', async () => {
    component.scrollingContainer = document.body;
    fixture.detectChanges();

    tableOfContentsService.addLink('', fakeLink({ name: '1️⃣', top: 42 }));
    tableOfContentsService.addLink('', fakeLink({ name: '2️⃣', top: 666 }));
    fixture.detectChanges();

    // Simulate scroll to link 1
    fixture.nativeElement.getBoundingClientRect.mockReturnValue({ top: 50 });
    document.body.dispatchEvent(new Event('scroll'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(getActiveLinks()).toEqual(['1️⃣']);

    // Simulate scroll to link 2
    fixture.nativeElement.getBoundingClientRect.mockReturnValue({ top: 1000 });
    document.body.dispatchEvent(new Event('scroll'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(getActiveLinks()).toEqual(['2️⃣']);
  });

  it('should set section name', async () => {
    fixture.detectChanges();

    tableOfContentsService.addLink('', fakeLink({ name: '1️⃣' }));
    tableOfContentsService.addLink('', fakeLink({ name: '2️⃣' }));
    tableOfContentsService.addLink('🦊', fakeLink({ name: '🦊' }));

    component.sectionNames = { '': 'Section name', '🦊': 'Fox section' };
    fixture.detectChanges();

    expect(getSectionsName()).toEqual(['Section name', 'Fox section']);
  });

  it('should remove section if links become empty', async () => {
    fixture.detectChanges();

    tableOfContentsService.addLink('', fakeLink({ name: '1' }));
    tableOfContentsService.addLink('', fakeLink({ name: '2' }));
    tableOfContentsService.addLink('🦊', fakeLink({ name: '🦊' }));

    component.sectionNames = { '': 'Section name', '🦊': 'Fox section' };
    fixture.detectChanges();

    expect(getSectionsName()).toEqual(['Section name', 'Fox section']);

    tableOfContentsService.removeLink('', '1️');
    tableOfContentsService.removeLink('', '2');

    fixture.detectChanges();
    expect(getSectionsName()).toEqual(['Fox section']);
  });

  it('should update location by clicking on link', async () => {
    fixture.detectChanges();

    tableOfContentsService.addLink('', fakeLink({ name: '1️⃣' }));
    tableOfContentsService.addLink('', fakeLink({ name: '2️⃣' }));
    fixture.detectChanges();

    component.onClick(({ stopPropagation: jest.fn() } as unknown) as PointerEvent, '1');

    expect(locationStrategy.path()).toBe('#1');
  });

  it('should update scroll position', async () => {
    component.scrollingContainer = document.body;

    // Init Dom with elements
    const element_1 = document.createElement('h2');
    element_1.id = 'toc-1';
    element_1.scrollIntoView = jest.fn();
    const element_2 = document.createElement('h2');
    element_2.id = 'toc-2';
    element_2.scrollIntoView = jest.fn();
    document.body.appendChild(element_1);
    document.body.appendChild(element_2);
    fixture.detectChanges();

    // Init links
    tableOfContentsService.addLink('', fakeLink({ name: '1️⃣' }));
    tableOfContentsService.addLink('', fakeLink({ name: '2️⃣' }));
    fixture.detectChanges();

    // Simulate location change to link 2️⃣
    locationStrategy.simulatePopState('#2');
    locationStrategy.simulatePopState('#2');
    expect(element_2.scrollIntoView).toHaveBeenCalledTimes(1);

    locationStrategy.simulatePopState('#1');

    expect(element_1.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  const getLinksText = () => [...fixture.nativeElement.querySelectorAll('.toc__link')].map((el) => el.innerHTML);
  const getActiveLinks = () => [...fixture.nativeElement.querySelectorAll('.toc__link.active')].map((el) => el.innerHTML);
  const getSectionName = () => fixture.nativeElement.querySelector('.toc__section-name')?.innerHTML;
  const getSectionsName = () => [...fixture.nativeElement.querySelectorAll('.toc__section-name')].map((e) => e?.innerHTML);
});

const fakeLink = (attr: Partial<TocSectionLink>): TocSectionLink => {
  const baseName = attr.name ?? 'Fake Link';
  const base = { active: false, id: camelCase(baseName), name: 'Fake Link', top: 10, type: 'h2' };

  return { ...base, ...attr };
};
