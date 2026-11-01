import { Component, inject, Input } from '@angular/core';
import { CardActions } from '@save-app/feature-cards';
import { Card } from '@save-app/models';

@Component({
  selector: 'collections-ui-tool-box',
  templateUrl: './tool-box.component.html',
  styleUrl: './tool-box.component.scss',
})
export class ToolBoxComponent {
  @Input() card!: Card;

  private readonly actions = inject(CardActions);

  star() {
    this.card.isFavorite = !this.card.isFavorite;
    this.actions.update(this.card);
  }

  share() {
    const subject = encodeURIComponent(this.card.key);
    const body = encodeURIComponent(`${this.card.value}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  archive() {
    this.card.isArchived = !this.card.isArchived;
    this.actions.update(this.card);
  }

  copy() {
    let copyCard = `${this.card.key}`;

    if (this.card.value) {
      copyCard += `: ${this.card.value}`;
    }

    navigator.clipboard.writeText(copyCard);
  }
}
