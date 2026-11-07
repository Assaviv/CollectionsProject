import { Component } from '@angular/core';
import { InputBuilderComponent } from '../../input/input-builder-component';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'save-app-story-input',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './story-input.component.html',
  styleUrls: ['./story-input.component.scss'],
})
export class StoryInputComponent extends InputBuilderComponent {}
