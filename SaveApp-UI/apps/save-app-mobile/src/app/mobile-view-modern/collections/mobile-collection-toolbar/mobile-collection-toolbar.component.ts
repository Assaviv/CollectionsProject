import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'save-app-mobile-collection-toolbar',
  standalone: true,
  templateUrl: './mobile-collection-toolbar.component.html',
  styleUrl: './mobile-collection-toolbar.component.scss',
})
export class MobileCollectionToolbarComponent {
  @Input() searchQuery = '';
  @Input() editMode = false;
  @Input() createFormOpen = false;
  @Input() syncDisabled = false;
  @Output() searchChange = new EventEmitter<string>();
  @Output() editToggle = new EventEmitter<void>();
  @Output() sync = new EventEmitter<void>();
  @Output() createToggle = new EventEmitter<void>();
}
