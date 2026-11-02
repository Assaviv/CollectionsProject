import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavItem, NavTabsComponent, ThemeService } from '@save-app/ui';
import { InputHostComponent } from '@save-app/feature-inputs';
import { CollectionsFacade } from '@save-app/data-access';
import { CollectionSelection, CollectionViewModernComponent } from '@save-app/feature-collections';
import { of, switchMap } from 'rxjs';
import { Card } from '@save-app/models';
import { CardsViewComponent } from '@save-app/feature-cards';
import { SideBarView } from './types';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    InputHostComponent,
    CardsViewComponent,
    NavTabsComponent,
    CollectionViewModernComponent
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'collections-mobile';
  readonly theme = inject(ThemeService);
  private readonly facade = inject(CollectionsFacade);
  private readonly selection = inject(CollectionSelection);

  activeSidePanel: SideBarView = 'cards';
  readonly navItems: NavItem<SideBarView>[] = [
    { id: 'collections', label: 'Collections', icon: 'icons/data-collection.png' },
    { id: 'cards', label: 'cards', icon: 'icons/flash-card.png' },
    { id: 'settings', label: 'Settings', icon: 'icons/gear.png' },
  ];

  readonly genericCollections = this.facade.collectionList$;
  readonly selectedId$ = this.selection.selectedId$;
  readonly cards$ = this.selectedId$.pipe(
    switchMap((id) => (id ? this.facade.cards$(id) : of([] as Card[]))),
  );

  ngOnInit() {
    if (this.facade.reorderCards.length !== 0) return

    this.facade.insertCollection({
      title: 'Mobile Collection',
      description: 'The mobile collection is a collection that is used to test the mobile app.',
      emoji: '📚',
    })
  }

  setSidePanel(view: SideBarView): void {
    this.activeSidePanel = view;
  }

  // TODO: handle case with no collections at all, cards still can be written
  // TODO: add touch interaction for changing input
  // TODO: decide what to do with the collection list for quick select
  //              Probably move right left to switch collections with dropbox on top
  //              And up and down to switch input method
}