import { Component } from '@angular/core';
import { CardBuilderComponent } from '../../card/card-builder-component/card-builder-component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'collections-ui-story-card',
  standalone: true,
  imports: [FormsModule, CardBuilderComponent],
  templateUrl: './story-card.component.html',
  styleUrls: ['./story-card.component.scss'],
})
export class StoryCardComponent extends CardBuilderComponent {}
