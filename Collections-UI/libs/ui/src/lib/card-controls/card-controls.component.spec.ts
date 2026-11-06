import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardControlsComponent } from './card-controls.component';

describe('CardControlsComponent', () => {
  let fixture: ComponentFixture<CardControlsComponent>;
  let component: CardControlsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardControlsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CardControlsComponent);
    component = fixture.componentInstance;
    component.isReadOnly = false;
    fixture.detectChanges();
  });

  it('shows save styling for editable cards and green styling for read-only cards', () => {
    const editButton = fixture.nativeElement.querySelector('.control .btn') as HTMLElement;

    expect(editButton.classList).toContain('save');
    expect(editButton.classList).not.toContain('green');

    component.isReadOnly = true;
    fixture.detectChanges();

    expect(editButton.classList).toContain('green');
    expect(editButton.classList).not.toContain('save');
  });

  it.each([
    ['edit', '.control .btn:first-child', 'edited'],
    ['tool box', '.control .btn:nth-child(2)', 'toolBoxToggled'],
    ['delete', '.control .btn:nth-child(3)', 'deleted'],
  ])('emits when the %s control is clicked', (_name, selector, output) => {
    const emitted = jest.fn();
    component[output as 'edited' | 'toolBoxToggled' | 'deleted'].subscribe(emitted);
    fixture.nativeElement.querySelector(selector).click();

    expect(emitted).toHaveBeenCalledTimes(1);
  });
});
