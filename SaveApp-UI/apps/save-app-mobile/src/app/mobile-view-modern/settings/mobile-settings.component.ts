import { NgFor, NgIf, NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { bgcolor } from '@save-app/models';
import { MobileThemeOption } from '../mobile-view-modern.types';

@Component({
  selector: 'save-app-mobile-settings',
  standalone: true,
  imports: [NgFor, NgIf, NgClass],
  templateUrl: './mobile-settings.component.html',
  styleUrl: './mobile-settings.component.scss',
})
export class MobileSettingsComponent {
  @Input() hasAccess = false;
  @Input() username: string | null | undefined;
  @Input() wavesEnabled = false;
  @Input() selectedTheme: bgcolor = 'system';
  @Input() themes: MobileThemeOption[] = [];
  @Output() signIn = new EventEmitter<void>();
  @Output() signOut = new EventEmitter<void>();
  @Output() wavesChanged = new EventEmitter<boolean>();
  @Output() themeChanged = new EventEmitter<bgcolor>();
  themesExpanded = false;
}
