import {
  Component,
  ElementRef,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CardType, Visibility } from '../types';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Observable } from 'rxjs';
import { DashboardManagerService } from '../desktop-view-modern/dashboard-manager.service';

@Component({
  template: '',
  animations: [
    trigger('cardAnimation', [
      state(
        'in',
        style({
          opacity: 0,
          transform: 'translateY(50px)',
        }),
      ),
      state(
        'visible',
        style({
          opacity: 1,
          transform: 'translateY(0px)',
        }),
      ),
      state(
        'out',
        style({
          opacity: 0,
          transform: 'translateY(-50px)',
        }),
      ),
      transition('in => visible', [animate('0.2s linear')]),
      transition('visible => out', [animate('0.2s linear')]),
    ]),
  ],
})
export abstract class InputBuilderComponent implements OnInit, OnDestroy {
  cardState: Visibility | 'in' | 'out' = 'in';
  inputForm!: FormGroup;

  @ViewChild('keyInput') keyInputElement!: ElementRef<HTMLInputElement>;

  constructor(
    @Inject('cardType') protected cardType: BehaviorSubject<CardType>,
    @Inject('animationObserver') protected animation: Observable<boolean>,
    protected dashboardManagerService: DashboardManagerService,
    protected fromBuilder: FormBuilder,
  ) {}

  ngOnDestroy(): void {
    setTimeout(() => {
      this.cardState = 'hidden';
    }, 0);
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.cardState = 'visible';
    }, 0);

    this.animation.subscribe((isDone: boolean) => {
      if (isDone) {
        setTimeout(() => {
          this.cardState = 'out';
        }, 0);
      }
    });

    this.inputForm = this.fromBuilder.group({
      keyInput: ['', Validators.required],
      valueInput: ['', Validators.required],
    });

    this.init();
  }

  init(): void {
    /* Override for furthere initialization */
  }

  submit(): void {
    if (this.inputForm.valid) {
      this.dashboardManagerService.currentCardsService?.createCard({
        cardType: this.cardType.getValue(),
        key: this.inputForm.get('keyInput')?.value,
        value: this.inputForm.get('valueInput')?.value,
      });

      this.inputForm.get('keyInput')?.reset();
      this.inputForm.get('valueInput')?.reset();
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      return;
    }

    if (!this.isCurrentElementTypeIsInput()) {
      this.keyInputElement?.nativeElement.focus();
    }
  }

  private isCurrentElementTypeIsInput(): boolean {
    return (
      document.activeElement?.tagName === 'INPUT' ||
      document.activeElement?.tagName === 'TEXTAREA'
    );
  }
}
