import { Component, Input } from '@angular/core';
import { VectorSearchComponent } from '@save-app/feature-chat';

@Component({
  selector: 'save-app-mobile-search-section',
  standalone: true,
  imports: [VectorSearchComponent],
  templateUrl: './mobile-search-section.component.html',
  styleUrl: './mobile-search-section.component.scss',
})
export class MobileSearchSectionComponent {
  @Input() wavesEnabled = false;
}
