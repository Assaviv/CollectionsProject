import { TestBed } from '@angular/core/testing';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Card, CardType } from '@save-app/models';
import { CollectionsFacade } from '@save-app/data-access';
import { CardsViewComponent } from './cards-view.component';

describe('CardsViewComponent', () => {
  let component: CardsViewComponent;
  let facade: { updateCard: jest.Mock; deleteCard: jest.Mock; reorderCards: jest.Mock };
  const cards: Card[] = [
    { id: 'a', key: 'A', cardType: CardType.SUBJECT, order: 0 },
    { id: 'b', key: 'B', cardType: CardType.SUBJECT, order: 1 },
  ];

  beforeEach(() => {
    facade = { updateCard: jest.fn(), deleteCard: jest.fn(), reorderCards: jest.fn() };
    TestBed.configureTestingModule({ imports: [CardsViewComponent], providers: [
      { provide: CollectionsFacade, useValue: facade },
    ] });
    component = TestBed.createComponent(CardsViewComponent).componentInstance;
    component.collectionId = 'collection-1';
    component.cards = cards;
  });

  it('forwards updates and removals for its collection', () => {
    component.update(cards[0]);
    component.remove(cards[1].id);
    expect(facade.updateCard).toHaveBeenCalledWith('collection-1', cards[0]);
    expect(facade.deleteCard).toHaveBeenCalledWith('collection-1', 'b');
  });

  it('skips actions without a collection and skips a no-op drop', () => {
    component.collectionId = null;
    component.update(cards[0]);
    component.remove('a');
    component.dropCard({ previousIndex: 0, currentIndex: 1 } as CdkDragDrop<Card[]>);
    component.collectionId = 'collection-1';
    component.dropCard({ previousIndex: 1, currentIndex: 1 } as CdkDragDrop<Card[]>);
    expect(facade.updateCard).not.toHaveBeenCalled();
    expect(facade.deleteCard).not.toHaveBeenCalled();
    expect(facade.reorderCards).not.toHaveBeenCalled();
  });

  it('delegates a reordered drop and tracks cards by id', () => {
    component.dropCard({ previousIndex: 0, currentIndex: 1 } as CdkDragDrop<Card[]>);
    expect(facade.reorderCards).toHaveBeenCalledWith('collection-1', cards, 0, 1);
    expect(component.trackByCardId(0, cards[1])).toBe('b');
  });
});
