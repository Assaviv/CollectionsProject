import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { LoginService } from '../login/login.service';
import { SideBarView } from '../side-bar/side-bar.component';
import { Card } from '@save-app/models';
import { CollectionsFacade } from '@save-app/data-access';
import { CollectionSelection } from '@save-app/feature-collections';
import { ThemeService } from '@save-app/ui';

@Component({
  selector: 'collections-ui-desktop-view-modern',
  templateUrl: './desktop-view-modern.component.html',
  styleUrl: './desktop-view-modern.component.scss',
})
export class DesktopViewModernComponent implements OnInit {
  private readonly facade = inject(CollectionsFacade);
  private readonly selection = inject(CollectionSelection);
  readonly theme = inject(ThemeService);

  activeSidePanel: SideBarView = 'collections';

  readonly genericCollections = this.facade.collectionList$;
  readonly selectedId$ = this.selection.selectedId$;
  readonly cards$ = this.selectedId$.pipe(
    switchMap((id) => (id ? this.facade.cards$(id) : of([] as Card[]))),
  );

  ngOnInit(): void {
    // if (loginService.getUsername === undefined) {
    //   router.navigate(['/login']);
    // }

    this.theme.bgcolor.set('modern-bg');
  }

  setSidePanel(view: SideBarView): void {
    this.activeSidePanel = view;
  }
}
