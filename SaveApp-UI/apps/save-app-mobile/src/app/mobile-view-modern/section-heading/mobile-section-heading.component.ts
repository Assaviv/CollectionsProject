import { NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'save-app-mobile-section-heading',
  standalone: true,
  imports: [NgIf],
  templateUrl: './mobile-section-heading.component.html',
  styleUrl: './mobile-section-heading.component.scss',
})
export class MobileSectionHeadingComponent {
  @Input({ required: true }) title = '';
  @Input() showAddButton = false;
  @Input() showAssistantAvatar = false;
  @Output() add = new EventEmitter<void>();
}
