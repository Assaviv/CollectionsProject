import { Component } from '@angular/core';
import { InputBuilderComponent } from '../input-builder-component';
import { Validators } from '@angular/forms';

@Component({
  selector: 'collections-ui-checkbox-input',
  templateUrl: './checkbox-input.component.html',
  styleUrls: ['./checkbox-input.component.scss'],
})
export class CheckboxInputComponent extends InputBuilderComponent {
  //* InputBuilder uses string value by defualt
  //* which prevent sending boolean value messages
  override init(): void {
    this.inputForm = this.fromBuilder.group({
      keyInput: ['', Validators.required],
      valueInput: [false],
    });
  }
}
