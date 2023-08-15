import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { CardType, Visibility } from '../types';
import { CardsManagmentService } from '../cards/cards-managment.service';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';

@Component({
  template: '',
  animations: [
    trigger('cardAnimation', [
      state(
        'visible',
        style({
          opacity: 1,
          transform: 'scale(1)',
        })
      ),
      state(
        'hidden',
        style({
          opacity: 0,
          transform: 'scale(0)',
        })
      ),
      transition('hidden => visible', [animate('0.3s ease-in')]),
      transition('visible => hidden', [animate('0.3s ease-out')]),
    ]),
  ],
})
export class InputBuilderComponent implements OnInit, OnDestroy {
  //   @Input() cardType$!: CardType;
  key!: string;
  value?: unknown;
  cardState: Visibility = 'hidden';
  inputForm!: FormGroup;

  constructor(
    @Inject('cardType') protected cardType: BehaviorSubject<CardType>,
    protected cardsManagmentService: CardsManagmentService,
    protected fromBuilder: FormBuilder
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
    if (this.inputForm.valid)
      this.cardsManagmentService.createCard({
        cardType: this.cardType.getValue(),
        key: this.inputForm.get('keyInput')?.value,
        value: this.inputForm.get('valueInput')?.value,
      });

    this.inputForm.get('keyInput')?.reset();
    this.inputForm.get('valueInput')?.reset();
  }
}
