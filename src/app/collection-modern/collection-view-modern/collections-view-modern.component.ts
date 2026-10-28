import { Component, Input } from '@angular/core';
import { Collection } from 'src/app/types';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { DashboardManagerService } from '../../desktop-view-modern/dashboard-manager.service';
import { CollectionsManagmentService } from '../../collection/collections-managment.service';

@Component({
  selector: 'collections-ui-collections-view-modern',
  templateUrl: './collections-view-modern.component.html',
  styleUrl: './collections-view-modern.component.scss',
})
export class CollectionViewModernComponent {
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
  
    constructor(
      private dashboardManagerService: DashboardManagerService,
      private collectionsManagementService: CollectionsManagmentService,
    ) {}

    onSearchChange(query: string): void {
      this.searchQuery = query;
      this.searchQuery$.next(query);
    }

    syncCollections(): void {
      this.collectionsManagementService.refreshFromServer();
    }

    toggleCreateForm(): void {
      this.showCreateForm = !this.showCreateForm;
    }
  
    protected get selectedCollection(): string {
      return this.dashboardManagerService.selectedCollection?.id ?? '';
    }
}
