import { NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { LoginRequiredComponent } from '@save-app/feature-security';

@Component({
  selector: 'save-app-mobile-analytics-section',
  standalone: true,
  imports: [NgIf, LoginRequiredComponent],
  templateUrl: './mobile-analytics-section.component.html',
  styleUrl: './mobile-analytics-section.component.scss',
})
export class MobileAnalyticsSectionComponent {
  @Input() hasAccess = false;
}
