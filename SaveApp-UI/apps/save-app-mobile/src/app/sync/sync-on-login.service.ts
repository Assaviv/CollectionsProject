import { inject, Injectable } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, filter } from 'rxjs';
import { CollectionsFacade } from '@save-app/data-access';
import { AuthService } from '@save-app/feature-security';

/**
 * Uploads the outbox as soon as the user signs in. On native, login finishes inside the running app
 * (deep-link callback, no page reload), so no other sync trigger fires and changes made while signed
 * out (cards, shared items) would otherwise wait for the next poll.
 */
@Injectable({ providedIn: 'root' })
export class SyncOnLoginService {
  private readonly facade = inject(CollectionsFacade);
  private readonly authenticated$ = toObservable(inject(AuthService).authenticated);

  start(): void {
    this.authenticated$
      .pipe(distinctUntilChanged(), filter(Boolean))
      .subscribe(() => void this.facade.syncNow());
  }
}
