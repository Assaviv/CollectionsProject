import { Component } from '@angular/core';
import { InputBuilderComponent } from '../input-builder-component';
import { CardType } from 'src/app/types';
import { Validators } from '@angular/forms';

@Component({
  selector: 'collections-ui-subject-input',
  templateUrl: './subject-input.component.html',
  styleUrls: ['./subject-input.component.scss'],
})
export class SubjectInputComponent extends InputBuilderComponent {
  override init(): void {
    this.inputForm = this.fromBuilder.group({
      keyInput: ['', Validators.required],
    });
  }
  // override submit(): void {
  //   if (this.inputForm.valid)
  //     this.cardsManagmentService.createCard({
  //       cardType: CardType.SUBJECT,
  //       key: this.inputForm.get('subjectInput')?.value,
  //     });
  //   this.inputForm.get('subjectInput')?.reset();
  // }
}
