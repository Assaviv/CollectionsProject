import { Component, Input } from '@angular/core';
import { Card } from 'src/app/types';
import { DashboardManagerService } from 'src/app/desktop-view-modern/dashboard-manager.service';

@Component({
  selector: 'collections-ui-tool-box',
  templateUrl: './tool-box.component.html',
  styleUrl: './tool-box.component.scss',
})
export class ToolBoxComponent {
  @Input() card!: Card;

  constructor(private dashboardManagerService: DashboardManagerService) {}

  star() {
    this.card.isFavorite = !this.card.isFavorite;
    this.dashboardManagerService.currentCardsService?.updateCard(this.card);
  }

  share() {
    const subject = encodeURIComponent(this.card.key);
    const body = encodeURIComponent(`${this.card.value}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  archive() {
    this.card.isArchived = !this.card.isArchived;
    this.dashboardManagerService.currentCardsService?.updateCard(this.card);
  }

  copy() {
    let copyCard = `${this.card.key}`;

    if (this.card.value) {
      copyCard += `: ${this.card.value}`;
    }

    navigator.clipboard.writeText(copyCard);
  }
}
