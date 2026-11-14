import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { of, switchMap } from 'rxjs';
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

type MobileSection = 'collections' | 'cards' | 'search' | 'analytics' | 'settings';

@Component({
  selector: 'save-app-mobile-view-modern',
  standalone: true,
  imports: [CommonModule, CardsViewComponent, MobileCollectionsViewComponent, InputHostComponent, VectorSearchComponent, NavTabsComponent, LoginRequiredComponent, SwipeDirective],
  templateUrl: './mobile-view-modern.component.html',
  styleUrl: './mobile-view-modern.component.scss',
})
export class MobileViewModernComponent {
  private readonly facade = inject(CollectionsFacade);
  readonly selection = inject(CollectionSelection);
  readonly input = inject(InputsManagmentService);
  readonly theme = inject(ThemeService);
  readonly auth = inject(AuthService);
  readonly hasUnsyncedChanges$ = this.facade.hasUnsyncedChanges$;
  readonly genericCollections = this.facade.collectionList$;
  readonly selectedId$ = this.selection.selectedId$;
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
  login(): void { void this.auth.login(); }
  logout(): void { void this.auth.logout(); }
}
