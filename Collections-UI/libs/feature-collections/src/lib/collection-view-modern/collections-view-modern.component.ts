import { Component, inject, Input } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { Collection } from '@save-app/models';
import { CollectionsFacade } from '@save-app/data-access';
import { CollectionModernComponent, CollectionSelection } from '@save-app/feature-collections';
import { CommonModule } from '@angular/common';
import { CollectionToolbarComponent } from './collection-toolbar/collection-toolbar.component';
import { CollectionCreateFormComponent } from './collection-create-form/collection-create-form.component';

@Component({
  selector: 'collections-ui-collections-view-modern',
  standalone: true,
  imports: [CommonModule, CollectionModernComponent, CollectionToolbarComponent, CollectionCreateFormComponent],
  templateUrl: './collections-view-modern.component.html',
  styleUrl: './collections-view-modern.component.scss',
})
export class CollectionViewModernComponent {
private readonly facade = inject(CollectionsFacade);
  private readonly selection = inject(CollectionSelection);
  private readonly searchQuery$ = new BehaviorSubject<string>('');

  searchQuery = '';
  editMode = false;
  showCreateForm = false;
  filteredCollections$!: Observable<Collection[]>;

    @Input() set collections(value: Observable<Collection[]>) {
      this.filteredCollections$ = combineLatest([value, this.searchQuery$]).pipe(
        map(([collections, query]) => {
          const normalizedQuery = query.trim().toLocaleLowerCase();
          return collections.filter((collection) =>
            `${collection.title} ${collection.description ?? ''}`
              .toLocaleLowerCase()
              .includes(normalizedQuery),
          );
        }),
      );
    }

    onSearchChange(query: string): void {
      this.searchQuery = query;
      this.searchQuery$.next(query);
    }

    syncCollections(): void {
      this.facade.syncNow();
    }

    toggleCreateForm(): void {
      this.showCreateForm = !this.showCreateForm;
    }
  
    protected get selectedCollection(): string {
      return this.selection.selectedId() ?? '';
    }

    trackById(_: number, collection: Collection): string {
      return collection.id;
    }
}
