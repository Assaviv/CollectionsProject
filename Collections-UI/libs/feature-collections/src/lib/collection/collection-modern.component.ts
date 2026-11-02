import { Component, inject, Input, OnInit } from '@angular/core';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { Collection, Visibility } from '@save-app/models';
import { CollectionSelection } from '@save-app/feature-collections';
import { CollectionsFacade } from '@save-app/data-access';
import { NgStyle } from '@angular/common';
import { CardControlsComponent } from '@save-app/ui';

@Component({
  selector: 'collections-ui-collection-modern',
  standalone: true,
  imports: [NgStyle, CardControlsComponent],
  templateUrl: './collection-modern.component.html',
  styleUrls: ['./collection-modern.component.scss'],
  animations: [
    trigger('cardAnimation', [
      state(
        'visible',
        style({
          opacity: 1,
          transform: 'scale(1)',
        }),
      ),
      state(
        'hidden',
        style({
          opacity: 0,
          transform: 'scale(0)',
        }),
      ),
      transition('hidden => visible', [animate('0.3s ease-in')]),
      transition('visible => hidden', [animate('0.3s ease-out')]),
    ]),
  ],
})
export class CollectionModernComponent implements OnInit {
  private readonly facade = inject(CollectionsFacade);
  private readonly selection = inject(CollectionSelection);

  @Input() collection!: Collection;
  cardState: Visibility = 'hidden';

  ngOnInit(): void {
    setTimeout(() => {
      this.cardState = 'visible';
    }, 0);
  }

  delete(): void {
    this.cardState = 'hidden';
    setTimeout(
      () => this.facade.deleteCollection(this.collection.id),
      300,
    );
  }

  openCollection() {
    this.selection.select(this.collection.id);
  }
}
