import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { Collection } from '@save-app/models';
import { CollectionsFacade } from '@save-app/data-access';
import { CollectionSelection } from '@save-app/feature-collections';
import { AuthService } from '@save-app/feature-security';
import { MobileCollectionComponent } from '../mobile-collection.component/mobile-collection.component';
import { MobileCollectionToolbarComponent } from '../mobile-collection-toolbar/mobile-collection-toolbar.component';
import { MobileCollectionCreateFormComponent } from '../mobile-collection-create-form/mobile-collection-create-form.component';

@Component({
  selector: 'save-app-mobile-collections-view',
  standalone: true,
  imports: [CommonModule, MobileCollectionToolbarComponent, MobileCollectionCreateFormComponent, MobileCollectionComponent],
  templateUrl: './mobile-collections-view.component.html',
  styleUrl: './mobile-collections-view.component.scss',
})
export class MobileCollectionsViewComponent {
  private readonly facade = inject(CollectionsFacade);
  private readonly selection = inject(CollectionSelection);
  readonly auth = inject(AuthService);
  private readonly query$ = new BehaviorSubject('');

  @Input({ required: true }) set collections(source: Observable<Collection[]>) {
    this.filteredCollections$ = combineLatest([source, this.query$]).pipe(
      map(([items, query]) => {
        const term = query.trim().toLocaleLowerCase();
        return items.filter(({ title, description }) => `${title} ${description ?? ''}`.toLocaleLowerCase().includes(term));
      }),
    );
  }

  filteredCollections$!: Observable<Collection[]>;
  @Input() wavesEnabled = false;
  searchQuery = '';
  editMode = false;
  createFormOpen = false;

  get selectedId(): string { return this.selection.selectedId() ?? ''; }
  onSearchChange(query: string): void { this.searchQuery = query; this.query$.next(query); }
  sync(): void { this.facade.syncNow(); }
  toggleCreate(): void { this.createFormOpen = !this.createFormOpen; }
  closeCreate(): void { this.createFormOpen = false; }
  trackById(_: number, collection: Collection): string { return collection.id; }
}
