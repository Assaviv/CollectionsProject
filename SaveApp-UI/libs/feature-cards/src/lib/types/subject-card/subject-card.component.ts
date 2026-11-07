import { Component } from '@angular/core';
import { CardBuilderComponent } from '../../card/card-builder-component/card-builder-component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'save-app-subject-card',
  standalone: true,
  imports: [FormsModule, CardBuilderComponent],
  templateUrl: './subject-card.component.html',
  styleUrls: ['./subject-card.component.scss'],
})
export class SubjectCardComponent extends CardBuilderComponent {}
