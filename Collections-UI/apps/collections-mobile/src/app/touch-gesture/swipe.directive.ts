import {
  Directive, ElementRef, EventEmitter, inject, Input, NgZone, OnDestroy, OnInit, Output,
} from '@angular/core';

export type SwipeAxes = 'horizontal' | 'vertical' | 'both';

@Directive({
  selector: '[collectionsUiSwipe]',
  standalone: true,
  host: { '[style.touch-action]': 'touchAction' },
})
export class SwipeDirective implements OnInit, OnDestroy {
  @Input('collectionsUiSwipe') axes: SwipeAxes | '' = 'both';
  @Input() swipeThreshold = 50;     // px the finger must travel
  @Input() swipeMaxDuration = 700;  // ms; slower drags are not swipes
  @Input() swipeEdgeGuard = 24;     // px; leaves the Android back-gesture edges alone
  @Input() swipeIgnore =
    'input, textarea, select, button, a, [contenteditable="true"], [data-no-swipe]';

  // "left" means the finger moved left
  @Output() swipeLeft = new EventEmitter<void>();
  @Output() swipeRight = new EventEmitter<void>();
  @Output() swipeUp = new EventEmitter<void>();
  @Output() swipeDown = new EventEmitter<void>();

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly zone = inject(NgZone);
  private start: { x: number; y: number; t: number; id: number } | null = null;

  /** Tells the browser which gestures it keeps; the rest reach us as pointer events. */
  get touchAction(): string {
    switch (this.axes) {
      case 'horizontal': return 'pan-y'; // vertical scrolling still works
      case 'vertical': return 'pan-x';
      default: return 'none';
    }
  }

  ngOnInit(): void {
    this.zone.runOutsideAngular(() => {
      this.el.addEventListener('pointerdown', this.onDown, { passive: true });
      this.el.addEventListener('pointerup', this.onUp, { passive: true });
      this.el.addEventListener('pointercancel', this.reset, { passive: true });
    });
  }

  ngOnDestroy(): void {
    this.el.removeEventListener('pointerdown', this.onDown);
    this.el.removeEventListener('pointerup', this.onUp);
    this.el.removeEventListener('pointercancel', this.reset);
  }

  private readonly onDown = (e: PointerEvent): void => {
    if (!e.isPrimary) return this.reset();
    if ((e.target as Element).closest(this.swipeIgnore)) return;
    const nearEdge =
      e.clientX < this.swipeEdgeGuard || e.clientX > window.innerWidth - this.swipeEdgeGuard;
    if (nearEdge && this.axes !== 'vertical') return;
    this.start = { x: e.clientX, y: e.clientY, t: e.timeStamp, id: e.pointerId };
  };

  private readonly onUp = (e: PointerEvent): void => {
    const s = this.start;
    this.reset();
    if (!s || e.pointerId !== s.id || e.timeStamp - s.t > this.swipeMaxDuration) return;

    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const axes = this.axes || 'both';

    // dominant axis only, so diagonal drags are ignored
    if (axes !== 'vertical' && absX >= this.swipeThreshold && absX > absY * 1.5) {
      this.emit(dx < 0 ? this.swipeLeft : this.swipeRight);
    } else if (axes !== 'horizontal' && absY >= this.swipeThreshold && absY > absX * 1.5) {
      this.emit(dy < 0 ? this.swipeUp : this.swipeDown);
    }
  };

  private readonly reset = (): void => {
    this.start = null;
  };

  private emit(output: EventEmitter<void>): void {
    this.zone.run(() => output.emit()); // re-enter Angular only when a swipe happened
  }
}
