import { Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { InputBuilderComponent } from '../input-builder-component';

@Component({
  selector: 'collections-ui-image-input',
  templateUrl: './image-input.component.html',
  styleUrls: ['./image-input.component.scss'],
})
export class ImageInputComponent extends InputBuilderComponent {
  //* InputBuilder uses string value by defualt
  //* which prevent sending image value messages
  override init(): void {
    this.inputForm = this.fromBuilder.group({
      keyInput: ['', Validators.required],
      valueInput: [Validators.required],
    });
  }

  handleImageInput(event: any) {
    // let selectedImage = event.target.files[0];
    // TODO: make a service for storing images.
  }
}
