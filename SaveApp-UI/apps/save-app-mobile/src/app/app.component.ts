import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavItem, NavTabsComponent, ThemeService } from '@save-app/ui';
import { InputHostComponent, InputsManagmentService } from '@save-app/feature-inputs';
import { CollectionsFacade } from '@save-app/data-access';
import { CollectionSelection, CollectionViewModernComponent } from '@save-app/feature-collections';
import { VectorSearchComponent } from '@save-app/feature-chat'
import { of, switchMap } from 'rxjs';
import { Card } from '@save-app/models';
import { CardsViewComponent } from '@save-app/feature-cards';
import { SideBarView } from './types';
import { SwipeDirective } from './touch-gesture/swipe.directive';
import { AuthService } from '@save-app/feature-security';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    InputHostComponent,
    CardsViewComponent,
    NavTabsComponent,
    CollectionViewModernComponent,
    SwipeDirective,
    VectorSearchComponent,
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'save-app-mobile';
  readonly theme = inject(ThemeService);
  readonly auth = inject(AuthService);
  readonly input = inject(InputsManagmentService);
  readonly selection = inject(CollectionSelection);
  private readonly facade = inject(CollectionsFacade);

  activeSidePanel: SideBarView = 'cards';
  readonly navItems: NavItem<SideBarView>[] = [
    { id: 'collections', label: 'Collections', icon: 'icons/data-collection.png' },
    { id: 'cards', label: 'cards', icon: 'icons/flash-card.png' },
    { id: 'search', label: 'search', icon: 'icons/ai-search.png'},
    { id: 'settings', label: 'Settings', icon: 'icons/gear.png' },
  ];

  readonly genericCollections = this.facade.collectionList$;
  readonly hasUnsyncedChanges$ = this.facade.hasUnsyncedChanges$;
  readonly selectedId$ = this.selection.selectedId$;
  readonly cards$ = this.selectedId$.pipe(
    switchMap((id) => (id ? this.facade.cards$(id) : of([] as Card[]))),
  );

  ngOnInit() {
    // if (this.facade.reorderCards.length !== 0) return

    // this.facade.insertCollection({
    //   title: 'Mobile Collection',
    //   description: 'The mobile collection is a collection that is used to test the mobile app.',
    //   emoji: '📚',
    // })
  }

  setSidePanel(view: SideBarView): void {
    this.activeSidePanel = view;
  }

  login(): void {
    void this.auth.login();
  }

  logout(): void {
    void this.auth.logout();
  }

  // TODO: handle case with no collections at all, cards still can be written
  // todo: cancel the drag and drop feature for mobile app, and replace it with scroll for the list
}
