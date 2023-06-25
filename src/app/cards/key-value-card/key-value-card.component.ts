import { Component, Input } from '@angular/core';

@Component({
  selector: 'collections-ui-key-value-card',
  templateUrl: './key-value-card.component.html',
  styleUrls: ['./key-value-card.component.scss'],
})
export class KeyValueCardComponent {
  @Input() key!: string;
  @Input() value!: string;
}
