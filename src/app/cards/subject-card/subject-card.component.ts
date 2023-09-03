import { Component } from '@angular/core';
import { CardBuilderComponent } from '../card-builder-component';

@Component({
  selector: 'collections-ui-subject-card',
  templateUrl: './subject-card.component.html',
  styleUrls: ['./subject-card.component.scss'],
})
export class SubjectCardComponent extends CardBuilderComponent {
  edit() {
    throw new Error('Method not implemented.');
  }
  expand() {
    throw new Error('Method not implemented.');
  }
}
