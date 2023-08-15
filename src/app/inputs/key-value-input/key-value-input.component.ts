import { Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { CardType } from 'src/app/types';
import { InputBuilderComponent } from '../input-builder-component';

@Component({
  selector: 'collections-ui-key-value-input',
  templateUrl: './key-value-input.component.html',
  styleUrls: ['./key-value-input.component.scss'],
})
export class KeyValueInputComponent extends InputBuilderComponent {
  override init(): void { // todo check if can remove
    this.inputForm = this.fromBuilder.group({
      keyInput: ['', Validators.required],
      valueInput: ['', Validators.required],
    });
  }

  override submit(): void {
    if (this.inputForm.valid)
      this.cardsManagmentService.createCard({
        cardType: CardType.KEY_VALUE,
        key: this.inputForm.get('keyInput')?.value,
        value: this.inputForm.get('valueInput')?.value,
      });
      
    this.inputForm.get('keyInput')?.reset();
    this.inputForm.get('valueInput')?.reset();
  }
}

