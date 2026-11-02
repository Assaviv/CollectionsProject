import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface NavItem<T extends string = string> {
  id: T;
  label: string;
  icon: string; // URL; the app decides which file
}

@Component({
  selector: 'collections-ui-nav-tabs',
  standalone: true,
  templateUrl: './nav-tabs.component.html',
  styleUrl: './nav-tabs.component.scss',
  host: { '[attr.data-orientation]': 'orientation' },
})
export class NavTabsComponent<T extends string = string> {
  @Input({ required: true }) items!: readonly NavItem<T>[];
  @Input() active: T | null = null;
  @Input() orientation: 'vertical' | 'horizontal' = 'vertical';
  @Input() ariaLabel = 'Views';
  @Output() selected = new EventEmitter<T>();
}
