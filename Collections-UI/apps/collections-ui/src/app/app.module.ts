import { routes } from './app.routes';
import { AppComponent } from './main/app.component';
import { RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { NavbarComponent } from './navbar/navbar.component';
import { DesktopViewModernComponent } from './desktop-view-modern/desktop-view-modern.component';
import { CollectionAnalyticsComponent } from './collection-analytics/collection-analytics.component';
import { VectorSearchComponent } from '@save-app/feature-chat';
import { environment } from 'src/environments/environments';
import { APP_INITIALIZER, inject, NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatChipsModule } from '@angular/material/chips';
import { BrowserModule } from '@angular/platform-browser';
import { MatSliderModule } from '@angular/material/slider';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { CardControlsComponent, NavTabsComponent } from '@save-app/ui';
import { CardCreator, InputHostComponent, SelectedCollectionCardCreator } from '@save-app/feature-inputs';
import { CardComponent, CardsViewComponent } from '@save-app/feature-cards';
import { CollectionModernComponent, CollectionViewModernComponent } from '@save-app/feature-collections';
import { CACHE_DATABASE, CacheKeyValueDB, provideDataAccess } from '@save-app/data-access';
import {authInterceptor, AuthService, KEYCLOAK_CONFIG } from '@save-app/feature-security';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DesktopViewModernComponent,
    NavbarComponent,
    CollectionAnalyticsComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    DragDropModule,
    MatDialogModule,
    PickerComponent,
    MatSliderModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    FormsModule,
    RouterModule.forRoot(routes, { initialNavigation: 'enabledBlocking' }),
    CardComponent,
    CardControlsComponent,
    InputHostComponent,
    CollectionModernComponent,
    NavTabsComponent,
    CardsViewComponent,
    CollectionViewModernComponent,
    VectorSearchComponent,
  ],
  providers: [
    { provide: CACHE_DATABASE, useClass: CacheKeyValueDB },
    { provide: KEYCLOAK_CONFIG, useValue: environment.keycloak },
    { provide: CardCreator, useExisting: SelectedCollectionCardCreator },
    { 
      provide: APP_INITIALIZER,
      useFactory: (authService: AuthService) => () => authService.init(),
      deps: [AuthService],
      multi: true,
    },
    provideHttpClient(withInterceptors([authInterceptor])),
    provideDataAccess({ apiBaseUrl: environment.apiBaseUrl })
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
