import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CollectionToolbarComponent } from './collection-toolbar.component';

describe('CollectionToolbarComponent', () => {
  let fixture: ComponentFixture<CollectionToolbarComponent>;
  let component: CollectionToolbarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CollectionToolbarComponent] }).compileComponents();
    fixture = TestBed.createComponent(CollectionToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('emits toolbar actions and the entered search query', () => {
    const search = jest.fn();
    const edit = jest.fn();
    const sync = jest.fn();
    const create = jest.fn();
    component.searchChange.subscribe(search);
    component.editToggle.subscribe(edit);
    component.sync.subscribe(sync);
    component.createToggle.subscribe(create);

    const input = fixture.nativeElement.querySelector('input');
    input.value = '  books  ';
    input.dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('[aria-label="Edit collections"]').click();
    fixture.nativeElement.querySelector('[aria-label="Sync collections"]').click();
    fixture.nativeElement.querySelector('[aria-label="Create collection"]').click();

    expect(search).toHaveBeenCalledWith('  books  ');
    expect(edit).toHaveBeenCalledTimes(1);
    expect(sync).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledTimes(1);
  });
});
