import { NgFor } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MobileNavItem, MobileSection } from '../mobile-view-modern.types';

@Component({
  selector: 'save-app-mobile-bottom-nav',
  standalone: true,
  imports: [NgFor],
  templateUrl: './mobile-bottom-nav.component.html',
  styleUrl: './mobile-bottom-nav.component.scss',
})
export class MobileBottomNavComponent {
  @Input() items: MobileNavItem[] = [];
  @Input() activeSection: MobileSection = 'collections';
  @Input() disabled: MobileNavItem[] = [];
  @Output() sectionSelected = new EventEmitter<MobileSection>();

  isItemDisabeld(item: MobileNavItem): boolean {
    return this.disabled.includes(item);
  }
}
