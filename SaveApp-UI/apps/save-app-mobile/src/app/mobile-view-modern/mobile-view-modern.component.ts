import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, OnDestroy, signal } from '@angular/core';
import { combineLatest, map, of, switchMap } from 'rxjs';
import { Card, bgcolor } from '@save-app/models';
import { CollectionsFacade } from '@save-app/data-access';
import { CollectionSelection } from '@save-app/feature-collections';
import { CardsViewComponent } from '@save-app/feature-cards';
import { InputHostComponent, InputsManagmentService } from '@save-app/feature-inputs';
import { VectorSearchComponent } from '@save-app/feature-chat';
import { AuthService, LoginRequiredComponent } from '@save-app/feature-security';
import { NavItem, NavTabsComponent, ThemeService } from '@save-app/ui';
import { SwipeDirective } from '../touch-gesture/swipe.directive';
import { MobileCollectionsViewComponent } from './collections/mobile-collections-view.component';
import { MobileSettingsComponent } from './settings/mobile-settings.component';
import { MobileBottomNavComponent } from './navigation/mobile-bottom-nav.component';
import { MobileCardsSectionComponent } from './cards/mobile-cards-section.component';
import { MobileHeaderComponent } from './header/mobile-header.component';
import { MobileSearchSectionComponent } from './search/mobile-search-section.component';
import { MobileSectionHeadingComponent } from './section-heading/mobile-section-heading.component';

type MobileSection = 'collections' | 'cards' | 'search' | 'analytics' | 'settings';

@Component({
  selector: 'save-app-mobile-view-modern',
  standalone: true,
  imports: [CommonModule, CardsViewComponent, MobileCollectionsViewComponent, InputHostComponent, VectorSearchComponent, NavTabsComponent, LoginRequiredComponent, SwipeDirective, MobileSettingsComponent, MobileBottomNavComponent, MobileCardsSectionComponent, MobileHeaderComponent, MobileSearchSectionComponent, MobileSectionHeadingComponent],
  templateUrl: './mobile-view-modern.component.html',
  styleUrl: './mobile-view-modern.component.scss',
})
export class MobileViewModernComponent implements OnDestroy {
  private readonly wavesStorageKey = 'save-app-mobile-theme-waves';
  private readonly host = inject(ElementRef<HTMLElement>);
  private swipeStart: { x: number; y: number; time: number; pointerId: number } | null = null;
  private readonly onCardsPointerDown = (event: PointerEvent): void => {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest('.cards-panel')) return;

    // Stop CDK drag before it sees pointerdown, while recording enough data for
    // the mobile shell to handle horizontal collection swipes itself.
    event.stopImmediatePropagation();
    this.swipeStart = null;
    if (!event.isPrimary || target.closest('button,a,input,textarea,select,[contenteditable="true"],[data-no-swipe]')) return;
    if (event.clientX < 24 || event.clientX > window.innerWidth - 24) return;
    this.swipeStart = { x: event.clientX, y: event.clientY, time: event.timeStamp, pointerId: event.pointerId };
  };
  private readonly onCardsPointerUp = (event: PointerEvent): void => {
    const start = this.swipeStart;
    this.swipeStart = null;
    if (!start || start.pointerId !== event.pointerId || event.timeStamp - start.time > 700) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) <= Math.abs(dy) * 1.5) return;
    if (dx < 0) this.selection.selectNext();
    else this.selection.selectPrevious();
  };
  private readonly onCardsPointerCancel = (): void => { this.swipeStart = null; };
  private readonly removeDragStartListeners = (() => {
    const host = this.host.nativeElement;
    host.addEventListener('pointerdown', this.onCardsPointerDown, true);
    host.addEventListener('pointerup', this.onCardsPointerUp, true);
    host.addEventListener('pointercancel', this.onCardsPointerCancel, true);
    return () => {
      host.removeEventListener('pointerdown', this.onCardsPointerDown, true);
      host.removeEventListener('pointerup', this.onCardsPointerUp, true);
      host.removeEventListener('pointercancel', this.onCardsPointerCancel, true);
    };
  })();
  private readonly facade = inject(CollectionsFacade);
  readonly selection = inject(CollectionSelection);
  readonly input = inject(InputsManagmentService);
  readonly theme = inject(ThemeService);
  readonly auth = inject(AuthService);
  readonly wavesEnabled = signal(this.readWavesPreference());
  readonly hasUnsyncedChanges$ = this.facade.hasUnsyncedChanges$;
  readonly genericCollections = this.facade.collectionList$;
  readonly selectedId$ = this.selection.selectedId$;
  readonly selectedCollectionTitle$ = combineLatest([this.genericCollections, this.selectedId$]).pipe(
    map(([collections, selectedId]) => collections.find((collection) => collection.id === selectedId)?.title ?? 'Cards'),
  );
  readonly cards$ = this.selectedId$.pipe(switchMap((id) => id ? this.facade.cards$(id) : of([] as Card[])));
  activeSection: MobileSection = 'collections';
  themesExpanded = false;
  readonly navItems: NavItem<MobileSection>[] = [
    { id: 'collections', label: 'Collections', icon: 'icons/data-collection.png' },
    { id: 'cards', label: 'Cards', icon: 'icons/flash-card.png' },
    { id: 'search', label: 'Search', icon: 'icons/ai-search.png' },
    { id: 'analytics', label: 'Analytics', icon: 'icons/data-analytics.png' },
    { id: 'settings', label: 'Settings', icon: 'icons/gear.png' },
  ];
  readonly themes: { id: bgcolor; label: string }[] = [
    { id: 'system', label: 'System' }, { id: 'elemental', label: 'Elemental' }, { id: 'elemental-dark', label: 'Elemental Dark' },
    { id: 'electric-violet', label: 'Electric Violet' }, { id: 'juicy-orange', label: 'Juicy Orange' },
    { id: 'mojito', label: 'Mojito' }, { id: 'cherry', label: 'Cherry' }, { id: 'modern-bg', label: 'Modern' },
  ];

  setSection(section: MobileSection): void { this.activeSection = section; }
  setTheme(theme: bgcolor): void { this.theme.setBgcolor = theme; }
  setWavesEnabled(enabled: boolean): void {
    this.wavesEnabled.set(enabled);
    try { localStorage.setItem(this.wavesStorageKey, String(enabled)); } catch { /* Keep the in-memory preference. */ }
  }
  login(): void { void this.auth.login(); }
  logout(): void { void this.auth.logout(); }

  ngOnDestroy(): void {
    this.removeDragStartListeners();
  }

  private readWavesPreference(): boolean {
    try {
      const saved = localStorage.getItem(this.wavesStorageKey);
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  }
}
