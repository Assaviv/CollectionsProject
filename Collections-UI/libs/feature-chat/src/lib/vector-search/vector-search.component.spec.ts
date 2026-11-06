import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Card, CardType } from '@save-app/models';
import { DATA_ACCESS_CONFIG } from '@save-app/data-access';
import { VectorSearchComponent } from './vector-search.component';

describe('VectorSearchComponent', () => {
  let fixture: ComponentFixture<VectorSearchComponent>;
  let component: VectorSearchComponent;
  let http: HttpTestingController;

  const cards: Card[] = [1, 2, 3, 4].map((number) => ({
    id: `card-${number}`,
    key: `Card ${number}`,
    value: `Value ${number}`,
    cardType: CardType.KEY_VALUE,
  }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VectorSearchComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DATA_ACCESS_CONFIG, useValue: { apiBaseUrl: '/api/' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VectorSearchComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('renders the initial empty state and a disabled send button', () => {
    expect(fixture.nativeElement.textContent).toContain(
      'Ask a question to find relevant cards in your collections.',
    );
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(true);
  });

  it('ignores blank messages and does not send a second request while loading', () => {
    component.draft = '   ';
    component.sendMessage();
    expect(component.messages).toEqual([]);
    http.expectNone('/api/Collections/search');

    component.draft = '  Where is my note?  ';
    component.sendMessage();
    component.draft = 'another question';
    component.sendMessage();

    const request = http.expectOne('/api/Collections/search');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBe('"Where is my note?"');
    expect(request.request.headers.get('Content-Type')).toBe('application/json');
    expect(component.messages).toEqual([{ role: 'user', text: 'Where is my note?' }]);
    expect(component.draft).toBe('another question');
    expect(component.loading).toBe(true);

    request.flush({ response: 'Found it' });
    expect(component.loading).toBe(false);
  });

  it('adds a text response and limits returned cards to three', () => {
    component.draft = 'find cards';
    component.sendMessage();
    http.expectOne('/api/Collections/search').flush({
      response: 'Here are the matches',
      cards,
    });

    expect(component.messages[1]).toEqual({
      role: 'assistant',
      text: 'Here are the matches',
      cards: cards.slice(0, 3),
    });
    expect(component.loading).toBe(false);
  });

  it('accepts an array of cards and shows the standard introduction', () => {
    component.draft = 'find cards';
    component.sendMessage();
    http.expectOne('/api/Collections/search').flush(cards);

    expect(component.messages[1]).toEqual({
      role: 'assistant',
      text: 'I found these cards for you:',
      cards: cards.slice(0, 3),
    });
  });

  it.each(['message', 'answer', 'text', 'result'])(
    'uses the %s response field when response is absent',
    (field) => {
      component.draft = 'ask';
      component.sendMessage();
      http.expectOne('/api/Collections/search').flush({ [field]: 'A reply' });

      expect(component.messages[1]).toEqual({ role: 'assistant', text: 'A reply', cards: [] });
    },
  );

  it('uses the first available response field and falls back when the response is empty', () => {
    component.draft = 'ask';
    component.sendMessage();
    http.expectOne('/api/Collections/search').flush({ response: 'Primary', message: 'Secondary' });
    expect(component.messages[1].text).toBe('Primary');

    component.draft = 'ask again';
    component.sendMessage();
    http.expectOne('/api/Collections/search').flush({ response: ' ' });
    expect(component.messages[3]).toEqual({ role: 'assistant', text: "Sorry I'm offline" });
  });

  it('shows an offline reply when the request fails', () => {
    component.draft = 'ask';
    component.sendMessage();
    http.expectOne('/api/Collections/search').flush('Unavailable', {
      status: 500,
      statusText: 'Server Error',
    });

    expect(component.messages[1]).toEqual({ role: 'assistant', text: "Sorry I'm offline" });
    expect(component.loading).toBe(false);
  });

  it('formats card values for display', () => {
    expect(component.formatCardValue(cards[0])).toBe('Value 1');
    expect(component.formatCardValue({ ...cards[0], value: { count: 2 } })).toBe('{"count":2}');
    expect(component.formatCardValue({ ...cards[0], value: null })).toBe('');
    expect(component.formatCardValue({ ...cards[0], value: undefined })).toBe('');
  });

  it('submits the compose form and renders assistant cards', () => {
    component.draft = 'show results';
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(
      new Event('submit'),
    );
    http.expectOne('/api/Collections/search').flush([cards[0]]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.chat-result-card')).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Card 1');
    expect(fixture.nativeElement.textContent).toContain('Value 1');
  });
});
