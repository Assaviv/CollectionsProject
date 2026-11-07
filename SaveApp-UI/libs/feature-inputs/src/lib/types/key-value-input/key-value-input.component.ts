import { Component } from '@angular/core';
import { InputBuilderComponent } from '../../input/input-builder-component';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'save-app-key-value-input',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './key-value-input.component.html',
  styleUrls: ['./key-value-input.component.scss'],
})
export class KeyValueInputComponent extends InputBuilderComponent {}
