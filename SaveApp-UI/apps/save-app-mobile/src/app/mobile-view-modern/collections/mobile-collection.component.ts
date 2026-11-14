import { Component, inject, Input, OnInit } from '@angular/core';
import { NgStyle } from '@angular/common';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Collection } from '@save-app/models';
import { CollectionsFacade } from '@save-app/data-access';
import { CollectionSelection } from '@save-app/feature-collections';
import { CardControlsComponent } from '@save-app/ui';

@Component({
  selector: 'save-app-mobile-collection',
  standalone: true,
  imports: [NgStyle, CardControlsComponent],
  templateUrl: './mobile-collection.component.html',
  styleUrl: './mobile-collection.component.scss',
  animations: [
    trigger('tileState', [
      state('visible', style({ opacity: 1, transform: 'scale(1)' })),
      state('hidden', style({ opacity: 0, transform: 'scale(.94)' })),
      transition('hidden => visible', animate('180ms ease-out')),
      transition('visible => hidden', animate('160ms ease-in')),
    ]),
  ],
})
export class MobileCollectionComponent implements OnInit {
  private readonly facade = inject(CollectionsFacade);
  private readonly selection = inject(CollectionSelection);

  @Input({ required: true }) collection!: Collection;
  state: 'visible' | 'hidden' = 'hidden';

  ngOnInit(): void {
    requestAnimationFrame(() => this.state = 'visible');
  }

  open(): void {
    this.selection.select(this.collection.id);
  }

  delete(): void {
    this.state = 'hidden';
    setTimeout(() => this.facade.deleteCollection(this.collection.id), 160);
  }
}
