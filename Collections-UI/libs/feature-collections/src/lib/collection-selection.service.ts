import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map } from 'rxjs';
import { CollectionsFacade } from '@save-app/data-access';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class CollectionSelection {
  private readonly facade = inject(CollectionsFacade);
  private readonly requestedId$ = new BehaviorSubject<string | null>(null);

  /** The requested collection, or the first one if it's missing or deleted. */
  readonly selectedCollection$ = combineLatest([this.requestedId$, this.facade.collections$]).pipe(
    map(([id, all]) => all.find((c) => c.id === id) ?? all[0] ?? null),
  );

  readonly selectedId$ = this.selectedCollection$.pipe(
    map((c) => c?.id ?? null),
    distinctUntilChanged(),
  );

  readonly selectedId = toSignal(this.selectedId$, { initialValue: null });

  select(id: string | null): void {
    this.requestedId$.next(id);
  }
}
