import { Component, ElementRef, NgZone, inject, ViewChild } from '@angular/core';
import { Card } from '@save-app/models';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DATA_ACCESS_CONFIG } from '@save-app/data-access';
import { AuthService, LoginRequiredComponent } from '@save-app/feature-security';

type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
  cards?: Card[];
};

@Component({
  selector: 'save-app-vector-search',
  standalone: true,
  imports: [CommonModule, FormsModule, LoginRequiredComponent],
  templateUrl: './vector-search.component.html',
  styleUrl: './vector-search.component.scss',
})
export class VectorSearchComponent {
  private readonly zone = inject(NgZone);
  readonly auth = inject(AuthService);
  private readonly endpoint = inject(DATA_ACCESS_CONFIG).apiBaseUrl.replace(/\/$/, '') + '/RAG/search';

  @ViewChild('messageList') private messageList?: ElementRef<HTMLElement>;

  messages: ChatMessage[] = [];
  draft = '';
  loading = false;
  loadingStatus = 'Searching…';

  sendMessage(): void {
    const text = this.draft.trim();
    if (!text || this.loading) return;

    this.messages.push({ role: 'user', text });
    const assistantMessage: ChatMessage = { role: 'assistant', text: '', cards: [] };
    this.messages.push(assistantMessage);
    this.draft = '';
    this.loading = true;
    this.loadingStatus = 'Searching…';
    this.scrollToLatest();
    void this.streamSearch(text, assistantMessage);
  }

  formatCardValue(card: Card): string {
    if (card.value === undefined || card.value === null) return '';
    return typeof card.value === 'string'
      ? card.value
      : JSON.stringify(card.value) ?? String(card.value);
  }

  private async streamSearch(query: string, assistantMessage: ChatMessage): Promise<void> {
    let completed = false;

    try {
      const token = await this.auth.getToken();
      const headers = new Headers({
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
      });
      if (token) headers.set('Authorization', `Bearer ${token}`);

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(query),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Search request failed (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (!completed) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, '\n');

        let eventEnd = buffer.indexOf('\n\n');
        while (eventEnd >= 0) {
          const rawEvent = buffer.slice(0, eventEnd);
          buffer = buffer.slice(eventEnd + 2);
          completed = this.handleSseEvent(rawEvent, assistantMessage);
          eventEnd = buffer.indexOf('\n\n');
        }

        if (done) break;
      }

      if (!completed) throw new Error('The answer stream ended unexpectedly.');
    } catch {
      this.zone.run(() => {
        assistantMessage.text = assistantMessage.cards?.length
          ? `${assistantMessage.text} Sorry, I couldn't finish the answer.`.trim()
          : "Sorry I'm offline";
      });
    } finally {
      this.zone.run(() => {
        this.loading = false;
        this.scrollToLatest();
      });
    }
  }

  private handleSseEvent(rawEvent: string, message: ChatMessage): boolean {
    let eventName = 'message';
    const data: string[] = [];

    for (const line of rawEvent.split('\n')) {
      if (line.startsWith('event:')) eventName = line.slice(6).trim();
      else if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
    }

    const payload = data.join('\n');
    if (eventName === 'cards') {
      const cards = JSON.parse(payload) as Card[];
      this.zone.run(() => {
        message.cards = cards.slice(0, 3);
        this.loadingStatus = 'Generating answer…';
        this.scrollToLatest();
      });
    } else if (eventName === 'token') {
      const token = JSON.parse(payload) as string;
      this.zone.run(() => {
        message.text += token;
        this.scrollToLatest();
      });
    } else if (eventName === 'error') {
      throw new Error(JSON.parse(payload) as string);
    } else if (eventName === 'done') {
      return true;
    }

    return false;
  }

  private scrollToLatest(): void {
    setTimeout(() => {
      const element = this.messageList?.nativeElement;
      if (element) element.scrollTop = element.scrollHeight;
    });
  }
}
