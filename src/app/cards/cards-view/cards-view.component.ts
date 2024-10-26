import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { Card } from 'src/app/types';
import { DashboardManagerService } from 'src/app/desktop-view/dashboard-manager.service';
import { CdkDragDrop } from '@angular/cdk/drag-drop';

@Component({
  selector: 'collections-ui-cards-view',
  templateUrl: './cards-view.component.html',
  styleUrl: './cards-view.component.scss',
})
export class CardsViewComponent {
  @Input() cards!: Observable<Card[]> | undefined;

  constructor(private dashboardManagerService: DashboardManagerService) {}

  dropCard(event: CdkDragDrop<Card[]>) {
    this.dashboardManagerService.currentCardsService?.changeCardsOrder(
      event.previousIndex,
      event.currentIndex,
    );
  }

  trackByCardId(index: number, card: Card): string {
    return card.id;
  }
}
