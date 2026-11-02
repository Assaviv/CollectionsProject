import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ThemeService } from '@save-app/ui';
import { InputHostComponent } from '@save-app/feature-inputs';
import { CollectionsFacade } from '@save-app/data-access';
import { CollectionSelection } from '@save-app/feature-collections';
import { of, switchMap } from 'rxjs';
import { Card } from '@save-app/models';
import { CardsViewComponent } from './cards-view/cards-view.component';
import { SideBarComponent, SideBarView } from './side-bar/side-bar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, CommonModule, InputHostComponent, CardsViewComponent, SideBarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'collections-mobile';
  readonly theme = inject(ThemeService);
  private readonly facade = inject(CollectionsFacade);
  private readonly selection = inject(CollectionSelection);

  activeSidePanel: SideBarView = 'collections';

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

  // TODO: add the navigation componnet
  // TODO: add touch interaction for changing input
  // TODO: decide what to do with the collection list for quick select
}