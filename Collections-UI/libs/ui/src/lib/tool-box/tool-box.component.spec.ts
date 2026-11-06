import { ComponentFixture, TestBed } from '@angular/core/testing';
import { trigger } from '@angular/animations';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ToolBoxComponent } from './tool-box.component';

describe('ToolBoxComponent', () => {
  let fixture: ComponentFixture<ToolBoxComponent>;
  let component: ToolBoxComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolBoxComponent],
      providers: [provideNoopAnimations()]
    })
      // The component template references this trigger, which is supplied by its host in the app.
      .overrideComponent(ToolBoxComponent, {
        set: { animations: [trigger('fadeInOut', [])] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ToolBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it.each([
    ['copy', 'copied'],
    ['archive', 'archived'],
    ['share', 'shared'],
    ['star', 'starred'],
  ])('emits %s action when its button is clicked', (_action, output) => {
    const emitted = jest.fn();
    component[output as 'copied' | 'archived' | 'shared' | 'starred'].subscribe(emitted);
    fixture.nativeElement.querySelector(`.fa-${_action}`).closest('button').click();

    expect(emitted).toHaveBeenCalledTimes(1);
  });
});
