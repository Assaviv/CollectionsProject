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

  private readonly ids = toSignal(
    this.facade.collectionList$.pipe(map((list) => list.map((c) => c.id))),
      { initialValue: [] as string[] },
    );

  select(id: string | null): void {
    this.requestedId$.next(id);
  }

  selectNext(): void {
    this.step(1);
  }

  selectPrevious(): void {
    this.step(-1);
  }

  private step(delta: number): void {
    const ids = this.ids();
    if (ids.length < 2) return;
    const current = Math.max(0, ids.indexOf(this.selectedId() ?? ids[0]));
    const next = Math.min(ids.length - 1, Math.max(0, current + delta)); // stops at the ends
    this.select(ids[next]);
  }
}
