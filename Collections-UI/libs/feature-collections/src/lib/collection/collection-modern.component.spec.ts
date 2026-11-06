import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { CollectionsFacade } from '@save-app/data-access';
import { CollectionSelection } from '@save-app/feature-collections';
import { Collection, CollectionType } from '@save-app/models';
import { CollectionModernComponent } from './collection-modern.component';

describe('CollectionModernComponent', () => {
  let component: CollectionModernComponent;
  let facade: { deleteCollection: jest.Mock };
  let selection: { select: jest.Mock };
  const collection: Collection = {
    id: 'collection-id', title: 'Reading', description: 'Books', emoji: '📚', collectionType: CollectionType.ANY,
  };

  beforeEach(() => {
    facade = { deleteCollection: jest.fn() };
    selection = { select: jest.fn() };
    TestBed.configureTestingModule({ imports: [CollectionModernComponent], providers: [
      { provide: CollectionsFacade, useValue: facade },
      { provide: CollectionSelection, useValue: selection },
    ] });
    component = TestBed.createComponent(CollectionModernComponent).componentInstance;
    component.collection = collection;
  });

  it('opens the collection and reveals the card after initialization', fakeAsync(() => {
    component.openCollection();
    expect(selection.select).toHaveBeenCalledWith(collection.id);
    component.ngOnInit();
    tick(0);
    expect(component.cardState).toBe('visible');
  }));

  it('deletes the collection after the hide animation delay', fakeAsync(() => {
    component.delete();
    expect(component.cardState).toBe('hidden');
    expect(facade.deleteCollection).not.toHaveBeenCalled();
    tick(300);
    expect(facade.deleteCollection).toHaveBeenCalledWith(collection.id);
  }));
});
