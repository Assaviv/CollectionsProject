import { TestBed } from '@angular/core/testing';
import { Card, CardType } from '@save-app/models';
import { CardActions } from '../../card-actions';
import { CardBuilderComponent } from './card-builder-component';

describe('CardBuilderComponent', () => {
  let component: CardBuilderComponent;
  let actions: jest.Mocked<CardActions>;
  const card: Card = {
    id: 'card-1', key: 'Title', value: 'Body', cardType: CardType.SUBJECT,
  };

  beforeEach(() => {
    actions = { update: jest.fn(), remove: jest.fn() };
    TestBed.configureTestingModule({ providers: [{ provide: CardActions, useValue: actions }] });
    component = TestBed.runInInjectionContext(() => new CardBuilderComponent());
    component.card = { ...card };
  });

  it('starts the entrance animation in the visible state', () => {
    jest.useFakeTimers();
    component.ngOnInit();
    expect(component.cardState).toBe('hidden');
    jest.runOnlyPendingTimers();
    expect(component.cardState).toBe('visible');
    jest.useRealTimers();
  });

  it('toggles read-only mode and saves when leaving edit mode', () => {
    component.edit();
    expect(component.isReadOnly).toBe(false);
    expect(actions.update).not.toHaveBeenCalled();

    component.edit();
    expect(component.isReadOnly).toBe(true);
    expect(actions.update).toHaveBeenCalledWith(component.card);
  });

  it('removes the card only after the hide animation completes', () => {
    component.delete();
    expect(component.cardState).toBe('hidden');
    component.onAnimationDone({ toState: 'visible' } as any);
    expect(actions.remove).not.toHaveBeenCalled();
    component.onAnimationDone({ toState: 'hidden' } as any);
    expect(actions.remove).toHaveBeenCalledWith(card.id);
  });

  it('toggles the toolbox and updates archive and favorite state', () => {
    component.toolBox();
    expect(component.isToolBoxVisible).toBe(true);
    component.toolBox();
    expect(component.isToolBoxVisible).toBe(false);

    component.archiveCard();
    component.toggleFavorite();
    expect(component.card.isArchived).toBe(true);
    expect(component.card.isFavorite).toBe(true);
    expect(actions.update).toHaveBeenNthCalledWith(1, component.card);
    expect(actions.update).toHaveBeenNthCalledWith(2, component.card);
  });

  it('copies the key and includes a value when present', () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    component.copyCard();
    expect(writeText).toHaveBeenLastCalledWith('Title: Body');

    component.card.value = '';
    component.copyCard();
    expect(writeText).toHaveBeenLastCalledWith('Title');
  });
});
