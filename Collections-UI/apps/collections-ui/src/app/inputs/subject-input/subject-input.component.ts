import { Component } from '@angular/core';
import { InputBuilderComponent } from '../input-builder-component';
import { Validators } from '@angular/forms';

@Component({
  selector: 'collections-ui-subject-input',
  templateUrl: './subject-input.component.html',
  styleUrls: ['./subject-input.component.scss'],
})
export class SubjectInputComponent extends InputBuilderComponent {
  //* InputBuilder uses valueInput validator
  //* which prevent sending messages without a value
  override init(): void {
    this.inputForm = this.fromBuilder.group({
      keyInput: ['', Validators.required],
    });
  }
}
