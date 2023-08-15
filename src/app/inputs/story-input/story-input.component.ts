import { Component } from '@angular/core';
import { InputBuilderComponent } from '../input-builder-component';

@Component({
  selector: 'collections-ui-story-input',
  templateUrl: './story-input.component.html',
  styleUrls: ['./story-input.component.scss'],
})
export class StoryInputComponent extends InputBuilderComponent {
  //! TODO: add extension for colored comments
}

