import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardsManagmentService } from '../cards/cards-managment.service';
import { CardType } from '../types';

@Component({
  selector: 'collections-ui-subject-input',
  templateUrl: './subject-input.component.html',
  styleUrls: ['./subject-input.component.scss'],
})
export class SubjectInputComponent implements OnInit {
  subjectForm!: FormGroup;

  constructor(
    private fromBuilder: FormBuilder,
    private cardManagmentService: CardsManagmentService
  ) {}

  ngOnInit(): void {
    this.subjectForm = this.fromBuilder.group({
      subjectInput: ['', Validators.required],
    });
  }

  submit() {
    if (this.subjectForm.valid)
      this.cardManagmentService.createCard({
        cardType: CardType.SUBJECT,
        key: this.subjectForm.get('subjectInput')?.value,
      });
    this.subjectForm.get('subjectInput')?.reset();
  }
}
