import { TestBed } from '@angular/core/testing';
import { CollectionsFacade } from '@save-app/data-access';
import { CollectionSelection } from '@save-app/feature-collections';
import { Collection, CollectionType } from '@save-app/models';
import { firstValueFrom, of } from 'rxjs';
import { CollectionViewModernComponent } from './collections-view-modern.component';

describe('CollectionViewModernComponent', () => {
  let component: CollectionViewModernComponent;
  let facade: { syncNow: jest.Mock };
  let selection: { selectedId: jest.Mock };
  const collections: Collection[] = [
    { id: 'one', title: 'Books', description: 'Things to read', emoji: '📚', collectionType: CollectionType.ANY },
    { id: 'two', title: 'Films', description: 'Watch later', emoji: '🎬', collectionType: CollectionType.ANY },
  ];

  beforeEach(() => {
    facade = { syncNow: jest.fn() };
    selection = { selectedId: jest.fn().mockReturnValue('one') };
    TestBed.configureTestingModule({ imports: [CollectionViewModernComponent], providers: [
      { provide: CollectionsFacade, useValue: facade },
      { provide: CollectionSelection, useValue: selection },
    ] });
    component = TestBed.createComponent(CollectionViewModernComponent).componentInstance;
    component.collections = of(collections);
  });

  it('filters by title or description without case or surrounding whitespace sensitivity', async () => {
    expect(await firstValueFrom(component.filteredCollections$)).toEqual(collections);
    component.onSearchChange('  READ  ');
    expect(await firstValueFrom(component.filteredCollections$)).toEqual([collections[0]]);
    component.onSearchChange('watch');
    expect(await firstValueFrom(component.filteredCollections$)).toEqual([collections[1]]);
  });

  it('forwards sync, toggles the create form, and exposes selected and tracking ids', () => {
    component.syncCollections();
    component.toggleCreateForm();
    expect(facade.syncNow).toHaveBeenCalledTimes(1);
    expect(component.showCreateForm).toBe(true);
    expect(component.trackById(0, collections[1])).toBe('two');
  });
});
