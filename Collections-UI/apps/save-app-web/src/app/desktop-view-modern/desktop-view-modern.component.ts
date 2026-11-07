import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { of, switchMap } from 'rxjs';
import { Card } from '@save-app/models';
import { CollectionsFacade } from '@save-app/data-access';
import { CollectionSelection, CollectionViewModernComponent } from '@save-app/feature-collections';
import { NavItem, NavTabsComponent, ThemeService } from '@save-app/ui';
import { CardsViewComponent } from '@save-app/feature-cards';
import { InputHostComponent } from '@save-app/feature-inputs';
import { VectorSearchComponent } from '@save-app/feature-chat';
import { NavbarComponent } from '../navbar/navbar.component';
import { CollectionAnalyticsComponent } from '../collection-analytics/collection-analytics.component';
import { SideBarView } from '../types';

@Component({
  selector: 'save-app-desktop-view-modern',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    CardsViewComponent,
    CollectionViewModernComponent,
    CollectionAnalyticsComponent,
    VectorSearchComponent,
    InputHostComponent,
    NavTabsComponent,
  ],
  templateUrl: './desktop-view-modern.component.html',
  styleUrl: './desktop-view-modern.component.scss',
})
export class DesktopViewModernComponent {
  private readonly facade = inject(CollectionsFacade);
  private readonly selection = inject(CollectionSelection);
  readonly theme = inject(ThemeService);

  activeSidePanel: SideBarView = 'collections';
  readonly navItems: NavItem<SideBarView>[] = [
    { id: 'collections', label: 'Collections', icon: 'icons/data-collection.png' },
    { id: 'analytics', label: 'analytics', icon: 'icons/data-analytics.png' },
    { id: 'search', label: 'Search', icon: 'icons/ai-search.png' },
    { id: 'settings', label: 'Settings', icon: 'icons/gear.png' },
  ];

  readonly genericCollections = this.facade.collectionList$;
  readonly selectedId$ = this.selection.selectedId$;
  readonly cards$ = this.selectedId$.pipe(
    switchMap((id) => (id ? this.facade.cards$(id) : of([] as Card[]))),
  );

  setSidePanel(view: SideBarView): void {
    this.activeSidePanel = view;
  }
}
