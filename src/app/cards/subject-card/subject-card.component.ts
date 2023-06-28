import { Component } from '@angular/core';
import { CardBuilderComponent } from '../card-builder-component';

@Component({
  selector: 'collections-ui-subject-card',
  templateUrl: './subject-card.component.html',
  styleUrls: ['./subject-card.component.scss'],
})
export class SubjectCardComponent extends CardBuilderComponent {}
