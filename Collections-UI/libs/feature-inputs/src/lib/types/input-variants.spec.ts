import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Type } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';
import { CardType } from '@save-app/models';
import { CardCreator } from '../input/card-creator';
import { InputBuilderComponent } from '../input/input-builder-component';
import { CheckboxInputComponent } from './checkbox-input/checkbox-input.component';
import { ImageInputComponent } from './image-input/image-input.component';
import { LinkInputComponent } from './link-input/link-input.component';
import { SubjectInputComponent } from './subject-input/subject-input.component';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('input type variants', () => {
  async function createFixture<T extends InputBuilderComponent>(component: Type<T>, cardType: CardType) {
    await TestBed.configureTestingModule({
      imports: [component],
      providers: [
        { provide: 'cardType', useValue: new BehaviorSubject(cardType) },
        { provide: 'animationObserver', useValue: of(false) },
        { provide: CardCreator, useValue: { create: jest.fn() } },
        FormBuilder,
        provideNoopAnimations()
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(component);
    fixture.detectChanges();
    return fixture as ComponentFixture<T>;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('allows a subject card without a value', async () => {
    const fixture = await createFixture(SubjectInputComponent, CardType.SUBJECT);
    const component = fixture.componentInstance;
    component.inputForm.setValue({ keyInput: 'Topic' });

    expect(component.inputForm.valid).toBe(true);
    expect(component.inputForm.contains('valueInput')).toBe(false);
  });

  it('defaults checkbox value to false and only requires a key', async () => {
    const fixture = await createFixture(CheckboxInputComponent, CardType.CHECKBOX);
    const component = fixture.componentInstance;

    expect(component.inputForm.value).toEqual({ keyInput: '', valueInput: false });
    component.inputForm.patchValue({ keyInput: 'Done' });
    expect(component.inputForm.valid).toBe(true);
  });

  it('validates link URLs and adds https when submitting a bare host', async () => {
    const fixture = await createFixture(LinkInputComponent, CardType.LINK);
    const component = fixture.componentInstance;
    const creator = TestBed.inject(CardCreator);
    component.inputForm.setValue({ keyInput: 'Website', valueInput: 'example.com' });

    expect(component.inputForm.valid).toBe(true);
    component.submit();

    expect(creator.create).toHaveBeenCalledWith({
      cardType: CardType.LINK,
      key: 'Website',
      value: 'https://example.com',
    });
  });

  it('rejects malformed link values', async () => {
    const fixture = await createFixture(LinkInputComponent, CardType.LINK);
    const component = fixture.componentInstance;
    component.inputForm.setValue({ keyInput: 'Website', valueInput: 'not a url' });

    expect(component.inputForm.controls['valueInput'].hasError('url')).toBe(true);
    expect(component.inputForm.invalid).toBe(true);
  });

  it('requires a value for images', async () => {
    const fixture = await createFixture(ImageInputComponent, CardType.IMAGE);
    const component = fixture.componentInstance;
    component.inputForm.setValue({ keyInput: 'Photo', valueInput: '' });

    expect(component.inputForm.invalid).toBe(true);
  });
});
