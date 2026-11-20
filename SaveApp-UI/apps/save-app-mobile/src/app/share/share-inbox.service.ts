import { inject, Injectable } from '@angular/core';
import { App } from '@capacitor/app';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { distinctUntilChanged, map } from 'rxjs';
import { CollectionsFacade } from '@save-app/data-access';
import { CardDraft, CardType } from '@save-app/models';

/** An item queued natively by ShareReceiverActivity. */
export interface SharedItem {
  id: string;
  text: string;
  type: 'link' | 'any';
  url?: string;
  key?: string;
  sharedAt?: number;
}

interface ShareInboxPlugin {
  getPending(): Promise<{ items: SharedItem[] }>;
  remove(options: { ids: string[] }): Promise<void>;
}

const ShareInbox = registerPlugin<ShareInboxPlugin>('ShareInbox');

export function toCardDraft(item: SharedItem): CardDraft {
  if (item.type === 'link' && item.url) {
    return { cardType: CardType.LINK, key: item.key ?? item.url, value: item.url };
  }
  return { cardType: CardType.SUBJECT, key: item.text };
}

/**
 * Moves items shared from other apps into the inbox, as normal cards.
 * The share sheet can't reach the app's IndexedDB, so it leaves them in a native queue;
 * this drains that queue whenever the inbox is known and on every app resume.
 */
@Injectable({ providedIn: 'root' })
export class ShareInboxService {
  private readonly facade = inject(CollectionsFacade);
  private inboxId: string | null = null;
  private draining = false;

  start(): void {
    if (!Capacitor.isNativePlatform()) return;

    // The inbox is only known once it has been synced at least once; items wait until then.
    this.facade.inbox$
      .pipe(map((inbox) => inbox?.id ?? null), distinctUntilChanged())
      .subscribe((id) => {
        this.inboxId = id;
        void this.drain();
      });

    void App.addListener('resume', () => void this.drain());
  }

  async drain(): Promise<void> {
    const inboxId = this.inboxId;
    if (!inboxId || this.draining) return;
    this.draining = true;
    try {
      const { items } = await ShareInbox.getPending();
      for (const item of items) {
        await this.facade.createCard(inboxId, toCardDraft(item));
        // Remove each one right after it's stored, so a failure later can't lose or duplicate it
        await ShareInbox.remove({ ids: [item.id] });
      }
    } catch (e) {
      console.error('Failed to import shared items; they stay queued for the next try', e);
    } finally {
      this.draining = false;
    }
  }
}
