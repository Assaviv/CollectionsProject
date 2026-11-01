import { NgComponentOutlet } from '@angular/common';
import { Component, HostListener, inject, Injector } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, map, switchMap, tap, timer } from 'rxjs';
import { InputsManagmentService } from './inputs-managment.service';
import { inputToComponentMap } from '../registry/input-registry';

@Component({
  selector: 'collections-ui-input-host',
  standalone: true,
  imports: [NgComponentOutlet],
  styles: [':host { display: block; }'],
  template: `<ng-container *ngComponentOutlet="inputComponent(); injector: inputInjector" />`,
})
export class InputHostComponent {
  private readonly inputs = inject(InputsManagmentService);
  private readonly leaving$ = new BehaviorSubject<boolean>(false);

  protected readonly inputInjector = Injector.create({
    providers: [
      { provide: 'cardType', useValue: this.inputs.inputType$ },
      { provide: 'animationObserver', useValue: this.leaving$ },
    ],
    parent: inject(Injector),
  });

  protected readonly inputComponent = toSignal(
    this.inputs.inputType$.pipe(
      tap(() => {
        // tells the current input to animate out
        this.leaving$.next(true);
        this.leaving$.next(false);
      }),
      // swap after the exit animation; a newer key press cancels a pending swap
      switchMap((type) => timer(150).pipe(map(() => inputToComponentMap.get(type) ?? null))),
    ),
    { initialValue: null },
  );

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp') this.inputs.changeToNextInput();
    if (event.key === 'ArrowDown') this.inputs.changeToPreviousInput();
  }
}
