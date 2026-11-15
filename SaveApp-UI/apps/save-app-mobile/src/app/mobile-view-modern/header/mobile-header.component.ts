import { AsyncPipe, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'save-app-mobile-header',
  standalone: true,
  imports: [AsyncPipe, NgIf],
  templateUrl: './mobile-header.component.html',
  styleUrl: './mobile-header.component.scss',
})
export class MobileHeaderComponent {
  @Input() hasAccess = false;
  @Input() username: string | null | undefined;
  @Input() hasUnsyncedChanges$?: Observable<boolean>;
  @Output() signIn = new EventEmitter<void>();
  @Output() signOut = new EventEmitter<void>();
}
