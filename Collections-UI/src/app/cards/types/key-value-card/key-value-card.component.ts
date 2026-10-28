import { Component } from '@angular/core';
import { CardBuilderComponent } from '../../card-builder-component/card-builder-component';

@Component({
  selector: 'collections-ui-key-value-card',
  templateUrl: './key-value-card.component.html',
  styleUrls: ['./key-value-card.component.scss'],
})
export class KeyValueCardComponent extends CardBuilderComponent {}
