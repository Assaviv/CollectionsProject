import { Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { InputBuilderComponent } from '../input-builder-component';

@Component({
  selector: 'collections-ui-image-input',
  templateUrl: './image-input.component.html',
  styleUrls: ['./image-input.component.scss'],
})
export class ImageInputComponent extends InputBuilderComponent {
  override init(): void {
    this.inputForm = this.fromBuilder.group({
      keyInput: ['', Validators.required],
      valueInput: ['', Validators.required],
    });
  }

  handleImageInput(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.inputForm.patchValue({ valueInput: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  }
}
