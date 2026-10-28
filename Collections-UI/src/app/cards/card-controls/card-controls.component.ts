import { Component, Input } from '@angular/core';

@Component({
  selector: 'collections-ui-card-controls',
  templateUrl: './card-controls.component.html',
  styleUrl: './card-controls.component.scss',
})
export class CardControlsComponent {
  @Input() isReadOnly!: boolean;
  @Input() delete!: () => void;
  @Input() edit!: () => void;
  @Input() toolBox!: () => void;
}
