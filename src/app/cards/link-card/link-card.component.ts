import { Component } from '@angular/core';
import { CardBuilderComponent } from '../card-builder-component';

@Component({
  selector: 'collections-ui-link-card',
  templateUrl: './link-card.component.html',
  styleUrls: ['./link-card.component.scss'],
})
export class LinkCardComponent extends CardBuilderComponent {}
