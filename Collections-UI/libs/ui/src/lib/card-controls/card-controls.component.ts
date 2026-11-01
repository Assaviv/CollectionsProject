import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'collections-ui-card-controls',
  standalone: true,
  templateUrl: './card-controls.component.html',
  styleUrl: './card-controls.component.scss',
})
export class CardControlsComponent {
  @Input() isReadOnly!: boolean;
  @Output() deleted = new EventEmitter<void>();
  @Output() edited = new EventEmitter<void>();
  @Output() toolBoxToggled = new EventEmitter<void>();
}
