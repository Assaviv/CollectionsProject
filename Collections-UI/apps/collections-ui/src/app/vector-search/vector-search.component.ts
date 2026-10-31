import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { timeout } from 'rxjs';
import { Card } from '@save-app/models';

type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
  cards?: Card[];
};

type VectorSearchResponse = {
  response?: string;
  message?: string;
  answer?: string;
  text?: string;
  result?: string;
  cards?: Card[];
  results?: Card[];
};

@Component({
  selector: 'collections-ui-vector-search',
  templateUrl: './vector-search.component.html',
  styleUrl: './vector-search.component.scss',
})
export class VectorSearchComponent {
  private readonly endpoint = 'http://localhost:5056/api/Collections/search';

  @ViewChild('messageList') private messageList?: ElementRef<HTMLElement>;

  messages: ChatMessage[] = [];
  draft = '';
  loading = false;

  constructor(private http: HttpClient) {}

  sendMessage(): void {
    const text = this.draft.trim();
    if (!text || this.loading) return;

    this.messages.push({ role: 'user', text });
    this.draft = '';
    this.loading = true;
    this.scrollToLatest();

    this.http
      .post<VectorSearchResponse | Card[]>(this.endpoint, '"' + text + '"', {
        headers: { 'Content-Type': 'application/json' },
      })
      .pipe(timeout(15000))
      .subscribe({
        next: (result) => {
          if (Array.isArray(result)) {
              this.messages.push({
                role: 'assistant',
                text: 'I found these cards for you:',
                cards: result.slice(0, 3),
            });
          } else {
            const response = this.normalizeResponse(result);
            this.messages.push({
            role: 'assistant',
            ...(response.text.trim() // TODO: Check the creation bug and clean code ready for first production as a docker compose
              ? response
              : { text: "Sorry I'm offline" }),
          });
          }
          
          this.loading = false;
          this.scrollToLatest();
        },
        error: () => {
          this.messages.push({
            role: 'assistant',
            text: "Sorry I'm offline",
          });
          this.loading = false;
          this.scrollToLatest();
        },
      });
  }

  formatCardValue(card: Card): string {
    if (card.value === undefined || card.value === null) return '';
    return typeof card.value === 'string'
      ? card.value
      : JSON.stringify(card.value) ?? String(card.value);
  }

  private normalizeResponse(
    result: VectorSearchResponse | string,
  ): Pick<ChatMessage, 'text' | 'cards'> {
    if (typeof result === 'string') return { text: result, cards: [] };

    const text =
      result.response ?? result.message ?? result.answer ?? result.text ?? result.result ?? '';
    return {
      text: typeof text === 'string' ? text : String(text),
      cards: (Array.isArray(result.cards) ? result.cards : result.results ?? []).slice(
        0,
        3,
      ),
    };
  }

  private scrollToLatest(): void {
    setTimeout(() => {
      const element = this.messageList?.nativeElement;
      if (element) element.scrollTop = element.scrollHeight;
    });
  }
}
