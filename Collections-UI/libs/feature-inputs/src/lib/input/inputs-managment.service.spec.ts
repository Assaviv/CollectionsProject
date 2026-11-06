import { TestBed } from '@angular/core/testing';
import { CardType } from '@save-app/models';
import { InputsManagmentService } from './inputs-managment.service';

describe('InputsManagmentService', () => {
  let service: InputsManagmentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InputsManagmentService);
  });

  it('starts with the subject input and ignores null input types', () => {
    expect(service.currentInput).toBe(CardType.SUBJECT);

    service.changeInput(null as unknown as CardType);

    expect(service.currentInput).toBe(CardType.SUBJECT);
  });

  it('publishes explicitly selected input types', () => {
    const emitted: CardType[] = [];
    service.inputType$.subscribe((type) => emitted.push(type));

    service.changeInput(CardType.LINK);

    expect(service.currentInput).toBe(CardType.LINK);
    expect(emitted).toEqual([CardType.SUBJECT, CardType.LINK]);
  });

  it('cycles through input types in either direction', () => {
    service.changeToNextInput();
    expect(service.currentInput).toBe(CardType.STORY);

    service.changeToPreviousInput();
    expect(service.currentInput).toBe(CardType.SUBJECT);

    service.changeToPreviousInput();
    expect(service.currentInput).toBe(CardType.IMAGE);

    service.changeToNextInput();
    expect(service.currentInput).toBe(CardType.SUBJECT);
  });
});
