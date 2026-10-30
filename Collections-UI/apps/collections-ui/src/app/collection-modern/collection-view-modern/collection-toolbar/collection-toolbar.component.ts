import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'collections-ui-collection-toolbar',
  templateUrl: './collection-toolbar.component.html',
  styleUrl: './collection-toolbar.component.scss',
})
export class CollectionToolbarComponent {
  @Input() searchQuery = '';
  @Input() editMode = false;
  @Input() createFormOpen = false;

  @Output() searchChange = new EventEmitter<string>();
  @Output() editToggle = new EventEmitter<void>();
  @Output() sync = new EventEmitter<void>();
  @Output() createToggle = new EventEmitter<void>();
}
