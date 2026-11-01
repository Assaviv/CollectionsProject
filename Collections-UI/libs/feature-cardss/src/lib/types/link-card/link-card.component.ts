import { Component } from '@angular/core';
import { CardBuilderComponent } from '../../card/card-builder-component/card-builder-component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'collections-ui-link-card',
  standalone: true,
  imports: [FormsModule, CardBuilderComponent],
  templateUrl: './link-card.component.html',
  styleUrls: ['./link-card.component.scss'],
})
export class LinkCardComponent extends CardBuilderComponent {}
