import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { LoginService } from '../login/login.service';
import { Card } from '@save-app/models';
import { CollectionsFacade } from '@save-app/data-access';
import { CollectionSelection } from '@save-app/feature-collections';
import { NavItem, ThemeService } from '@save-app/ui';
import { environment } from 'src/environments/environments';
import { SideBarView } from '../types';

@Component({
  selector: 'collections-ui-desktop-view-modern',
  templateUrl: './desktop-view-modern.component.html',
  styleUrl: './desktop-view-modern.component.scss',
})
export class DesktopViewModernComponent implements OnInit {
  private readonly facade = inject(CollectionsFacade);
  private readonly selection = inject(CollectionSelection);
  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);
  readonly theme = inject(ThemeService);

  activeSidePanel: SideBarView = 'collections';
  readonly navItems: NavItem<SideBarView>[] = [
    { id: 'collections', label: 'Collections', icon: 'icons/data-collection.png' },
    { id: 'analytics', label: 'analytics', icon: 'icons/data-analytics.png' },
    { id: 'search', label: 'Search', icon: 'icons/ai-search.png' },
    { id: 'settings', label: 'Settings', icon: 'icons/gear.png' },
  ];

  readonly genericCollections = this.facade.collectionList$;
  readonly selectedId$ = this.selection.selectedId$;
  readonly cards$ = this.selectedId$.pipe(
    switchMap((id) => (id ? this.facade.cards$(id) : of([] as Card[]))),
  );

  ngOnInit(): void {
    if (environment.isProduction && this.loginService.getUsername === undefined) {
      this.router.navigate(['/login']);
    }

    this.theme.bgcolor.set('modern-bg');
  }

  setSidePanel(view: SideBarView): void {
    this.activeSidePanel = view;
  }
}
