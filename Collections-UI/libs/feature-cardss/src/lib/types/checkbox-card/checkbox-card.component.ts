import { Component } from '@angular/core';
import { CardBuilderComponent } from '../../card/card-builder-component/card-builder-component';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'collections-ui-checkbox-card',
  standalone: true,
  imports: [NgClass, FormsModule, CardBuilderComponent],
  templateUrl: './checkbox-card.component.html',
  styleUrls: ['./checkbox-card.component.scss'],
})
export class CheckboxCardComponent extends CardBuilderComponent {
  public changeState() {
    this.card.value = !this.card.value;
    this.actions.update(this.card);
  }
}
