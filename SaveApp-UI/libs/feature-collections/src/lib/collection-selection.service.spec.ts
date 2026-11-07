import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { CollectionsFacade } from '@save-app/data-access';
import { Collection, CollectionType } from '@save-app/models';
import { CollectionSelection } from './collection-selection.service';

describe('CollectionSelection', () => {
  let service: CollectionSelection;
  let collections: BehaviorSubject<Collection[]>;
  const values: Collection[] = [
    { id: 'one', title: 'One', description: '', emoji: '1', collectionType: CollectionType.ANY },
    { id: 'two', title: 'Two', description: '', emoji: '2', collectionType: CollectionType.ANY },
    { id: 'three', title: 'Three', description: '', emoji: '3', collectionType: CollectionType.ANY },
  ];

  beforeEach(() => {
    collections = new BehaviorSubject(values);
    TestBed.configureTestingModule({ providers: [
      CollectionSelection,
      { provide: CollectionsFacade, useValue: { collections$: collections, collectionList$: collections.asObservable() } },
    ] });
    service = TestBed.inject(CollectionSelection);
  });

  it('defaults to the first collection and falls back when a requested collection disappears', async () => {
    await expect(firstValueFrom(service.selectedId$)).resolves.toBe('one');
    service.select('three');
    await expect(firstValueFrom(service.selectedId$)).resolves.toBe('three');
    collections.next(values.slice(0, 2));
    await expect(firstValueFrom(service.selectedId$)).resolves.toBe('one');
  });

  it('steps through collections and stops at either end', () => {
    service.selectPrevious();
    expect(service.selectedId()).toBe('one');
    service.selectNext();
    expect(service.selectedId()).toBe('two');
    service.selectNext();
    service.selectNext();
    expect(service.selectedId()).toBe('three');
  });
});
