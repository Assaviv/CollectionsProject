import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { Collection } from '@save-app/models';
import { MobileCollectionsViewComponent } from '../mobile-collections-view/mobile-collections-view.component';

@Component({
  selector: 'save-app-mobile-collections-section',
  standalone: true,
  imports: [MobileCollectionsViewComponent],
  templateUrl: './mobile-collections-section.component.html',
  styleUrl: './mobile-collections-section.component.scss',
})
export class MobileCollectionsSectionComponent {
  @Input({ required: true }) collections!: Observable<Collection[]>;
  @Input() wavesEnabled = false;
}
