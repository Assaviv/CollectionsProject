import { Component, Input } from '@angular/core';

@Component({
  selector: 'collections-ui-subject-card',
  templateUrl: './subject-card.component.html',
  styleUrls: ['./subject-card.component.scss'],
})
export class SubjectCardComponent {
  @Input()
  subject!: string;
}
