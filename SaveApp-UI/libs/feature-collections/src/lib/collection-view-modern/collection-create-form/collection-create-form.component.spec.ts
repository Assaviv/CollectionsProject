import { TestBed } from '@angular/core/testing';
import { CollectionsFacade } from '@save-app/data-access';
import { CollectionSelection } from '@save-app/feature-collections';
import { CollectionCreateFormComponent } from './collection-create-form.component';

describe('CollectionCreateFormComponent', () => {
  let component: CollectionCreateFormComponent;
  let facade: { insertCollection: jest.Mock };
  let selection: { select: jest.Mock };

  beforeEach(() => {
    facade = { insertCollection: jest.fn().mockResolvedValue('created-id') };
    selection = { select: jest.fn() };
    TestBed.configureTestingModule({ imports: [CollectionCreateFormComponent], providers: [
      { provide: CollectionsFacade, useValue: facade },
      { provide: CollectionSelection, useValue: selection },
    ] });
    component = TestBed.createComponent(CollectionCreateFormComponent).componentInstance;
  });

  it('marks invalid fields as touched without creating a collection', async () => {
    await component.createCollection();
    expect(component.collectionForm.controls['title'].touched).toBe(true);
    expect(component.collectionForm.controls['description'].touched).toBe(true);
    expect(facade.insertCollection).not.toHaveBeenCalled();
  });

  it('trims values, creates the collection, selects it, and emits completion', async () => {
    component.collectionForm.setValue({ title: '  Reading  ', description: '  Books to read  ' });
    const created = jest.fn();
    component.created.subscribe(created);

    await component.createCollection();

    expect(facade.insertCollection).toHaveBeenCalledWith({
      title: 'Reading', description: 'Books to read', emoji: '📁',
    });
    expect(selection.select).toHaveBeenCalledWith('created-id');
    expect(created).toHaveBeenCalledTimes(1);
  });
});
