import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'collections-ui-tool-box',
  standalone: true,
  templateUrl: './tool-box.component.html',
  styleUrl: './tool-box.component.scss',
})
export class ToolBoxComponent {
  @Output() starred = new EventEmitter<void>();
  @Output() shared = new EventEmitter<void>();
  @Output() archived = new EventEmitter<void>();
  @Output() copied = new EventEmitter<void>();
}
