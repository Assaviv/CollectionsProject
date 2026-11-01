import { Component, DestroyRef, HostListener, inject, Injector, OnInit, Type } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, of, switchMap } from 'rxjs';
import { InputBuilderComponent } from '../inputs/input-builder-component';
import { InputsManagmentService } from '../inputs/inputs-managment.service';
import { LoginService } from '../login/login.service';
import { inputToComponentMap } from '../types';
import { SideBarView } from '../side-bar/side-bar.component';
import { Card } from '@save-app/models';
import { CollectionsFacade } from '@save-app/data-access';
import { CollectionSelection } from '@save-app/feature-collections';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ThemeService } from '@save-app/ui';

@Component({
  selector: 'collections-ui-desktop-view-modern',
  templateUrl: './desktop-view-modern.component.html',
  styleUrl: './desktop-view-modern.component.scss',
})
export class DesktopViewModernComponent implements OnInit {
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(CollectionsFacade);
  private readonly selection = inject(CollectionSelection);
  private readonly inputsManagmentService = inject(InputsManagmentService);
  readonly theme = inject(ThemeService);

  activeSidePanel: SideBarView = 'collections';
  dynamicComponentInjector!: Injector;
  inputComponent: Type<InputBuilderComponent> | null = null;
  animationSubject = new BehaviorSubject<boolean>(false);

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
    this.setupInput();
  }

  private setupInput(): void {
    this.inputsManagmentService.inputType$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((inputType) => {
        this.animationSubject.next(true);

        setTimeout(
          () => (this.inputComponent = inputToComponentMap.get(inputType) ?? null),
          150,
        );

       this.animationSubject.next(false);
    });

    this.dynamicComponentInjector = Injector.create({
      providers: [
        { provide: 'cardType', useValue: this.inputsManagmentService.inputType$ },
        { provide: 'animationObserver', useValue: this.animationSubject },
      ],
      parent: this.injector,
    });
  }

  setSidePanel(view: SideBarView): void {
    this.activeSidePanel = view;
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowUp':
        this.inputsManagmentService.changeToNextInput();
        break;
      case 'ArrowDown':
        this.inputsManagmentService.changeToPreviousInput();
        break;
      default:
        break;
    }
  }
}
