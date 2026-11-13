import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'save-app-card-controls',
  standalone: true,
  imports: [NgIf],
  templateUrl: './card-controls.component.html',
  styleUrl: './card-controls.component.scss',
})
export class CardControlsComponent {
  @Input() isReadOnly!: boolean;
  @Input() isSynced = false;
  @Input() showSyncStatus = true;
  @Output() deleted = new EventEmitter<void>();
  @Output() edited = new EventEmitter<void>();
  @Output() toolBoxToggled = new EventEmitter<void>();
}
