import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Collection, CollectionType } from '../../types';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { DashboardManagerService } from '../../desktop-view/dashboard-manager.service';
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
    collectionForm: FormGroup;
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
      private formBuilder: FormBuilder,
      private dashboardManagerService: DashboardManagerService,
      private collectionsManagementService: CollectionsManagmentService,
    ) {
      this.collectionForm = this.formBuilder.group({
        title: ['', [Validators.required, Validators.maxLength(32)]],
        description: ['', [Validators.required, Validators.maxLength(128)]],
      });
    }

    onSearchChange(query: string): void {
      this.searchQuery = query;
      this.searchQuery$.next(query);
    }

    syncCollections(): void {
      this.collectionsManagementService.refreshFromServer();
    }

    toggleCreateForm(): void {
      this.showCreateForm = !this.showCreateForm;
      if (!this.showCreateForm) {
        this.collectionForm.reset();
      }
    }

    createCollection(): void {
      if (this.collectionForm.invalid) {
        this.collectionForm.markAllAsTouched();
        return;
      }

      const { title, description } = this.collectionForm.getRawValue();
      const normalizedTitle = title.trim();
      const normalizedDescription = description.trim();

      if (!normalizedTitle || !normalizedDescription) {
        this.collectionForm.markAllAsTouched();
        return;
      }

      this.collectionsManagementService.addItem({
        title: normalizedTitle,
        description: normalizedDescription,
        emoji: '📁',
        collectionType: CollectionType.ANY,
        backgroundColor: '#FFFFFF',
      });
      this.toggleCreateForm();
    }
  
    protected get selectedCollection(): string {
      return this.dashboardManagerService.selectedCollection.id;
    }
}
