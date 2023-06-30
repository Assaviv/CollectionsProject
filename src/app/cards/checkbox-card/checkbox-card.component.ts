import { Component } from '@angular/core';
import { CardBuilderComponent } from '../card-builder-component';

@Component({
  selector: 'collections-ui-checkbox-card',
  templateUrl: './checkbox-card.component.html',
  styleUrls: ['./checkbox-card.component.scss'],
})
export class CheckboxCardComponent extends CardBuilderComponent {
  constructor() {
    super();
    this.value = false;
  }

  public changeState() {
    this.value = !this.value;
  }
}
