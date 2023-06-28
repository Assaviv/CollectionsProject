import { Component, Input } from '@angular/core';
import { CardType } from '../types';

@Component({
  template: '',
})
export class CardBuilderComponent {
  @Input() cardType!: CardType;
  @Input() key!: string;
  @Input() value?: unknown;
}
