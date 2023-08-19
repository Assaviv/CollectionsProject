import { Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { InputBuilderComponent } from '../input-builder-component';

@Component({
  selector: 'collections-ui-link-input',
  templateUrl: './link-input.component.html',
  styleUrls: ['./link-input.component.scss'],
})
export class LinkInputComponent extends InputBuilderComponent {
  //* InputBuilder uses only required validator by defulat
  //* which prevent using more validators
  override init(): void {
    const URL_REGEXP =
      /[(http(s)?):\\/\\/(www\\.)?a-zA-Z0-9@:%._\\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)/gi;
    this.inputForm = this.fromBuilder.group({
      keyInput: ['', Validators.required],
      valueInput: ['', [Validators.required, Validators.pattern(URL_REGEXP)]],
    });
  }

  //* InputBuilder don't have link validation
  //* which prevent using more www... links
  override submit(): void {
    if (this.inputForm.valid) {
      let value = this.inputForm.get('valueInput')?.value as string;
      if (!value.startsWith('http')) value = 'https://' + value;
      this.cardsManagmentService.createCard({
        cardType: this.cardType.getValue(),
        key: this.inputForm.get('keyInput')?.value,
        value: value,
      });

      this.inputForm.get('keyInput')?.reset();
      this.inputForm.get('valueInput')?.reset();
    }
  }
}
