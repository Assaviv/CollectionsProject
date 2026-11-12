import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, LoginRequiredComponent } from '@save-app/feature-security';

@Component({
  selector: 'save-app-collection-analytics',
  standalone: true,
  imports: [CommonModule, LoginRequiredComponent],
  templateUrl: './collection-analytics.component.html',
  styleUrl: './collection-analytics.component.scss',
})
export class CollectionAnalyticsComponent {
  readonly auth = inject(AuthService);
}
