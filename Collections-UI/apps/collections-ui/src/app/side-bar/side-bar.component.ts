import { Component, EventEmitter, Input, Output } from '@angular/core';

export type SideBarView = 'collections' | 'analytics' | 'search' | 'settings';

@Component({
  selector: 'collections-ui-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss',
})
export class SideBarComponent {
  @Input() activeView: SideBarView = 'collections';
  @Output() viewChange = new EventEmitter<SideBarView>();

  selectView(view: SideBarView): void {
    this.viewChange.emit(view);
  }
}
