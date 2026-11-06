import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';
import { CardType } from '@save-app/models';
import { InputBuilderComponent } from './input-builder-component';
import { CardCreator } from './card-creator';

@Component({ standalone: true, template: '' })
class TestInputComponent extends InputBuilderComponent {}

describe('InputBuilderComponent', () => {
  let fixture: ComponentFixture<TestInputComponent>;
  let component: TestInputComponent;
  let create: jest.Mock;

  beforeEach(async () => {
    create = jest.fn();
    await TestBed.configureTestingModule({
      imports: [TestInputComponent],
      providers: [
        { provide: 'cardType', useValue: new BehaviorSubject(CardType.STORY) },
        { provide: 'animationObserver', useValue: of(false) },
        { provide: CardCreator, useValue: { create } },
        FormBuilder,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('requires both key and value by default', () => {
    expect(component.inputForm.invalid).toBe(true);

    component.inputForm.setValue({ keyInput: 'Title', valueInput: 'Body' });

    expect(component.inputForm.valid).toBe(true);
  });

  it('does not create a card from an invalid form', () => {
    component.submit();

    expect(create).not.toHaveBeenCalled();
  });

  it('creates a draft with the current type and resets the form', () => {
    component.inputForm.setValue({ keyInput: 'Title', valueInput: 'Body' });

    component.submit();

    expect(create).toHaveBeenCalledWith({ cardType: CardType.STORY, key: 'Title', value: 'Body' });
    expect(component.inputForm.value).toEqual({ keyInput: null, valueInput: null });
  });
});
