import { Component } from '@angular/core';
import { CardBuilderComponent } from '../../card-builder-component/card-builder-component';

@Component({
  selector: 'collections-ui-image-card',
  templateUrl: './image-card.component.html',
  styleUrls: ['./image-card.component.scss'],
})
export class ImageCardComponent extends CardBuilderComponent {}
