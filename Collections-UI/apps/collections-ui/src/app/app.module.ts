import { routes } from './app.routes';
import { AppComponent } from './main/app.component';
import { RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { NavbarComponent } from './navbar/navbar.component';
import { DesktopViewModernComponent } from './desktop-view-modern/desktop-view-modern.component';
import { CollectionAnalyticsComponent } from './collection-analytics/collection-analytics.component';
import { VectorSearchComponent } from '@save-app/feature-chat';
import { environment } from 'src/environments/environments';
import { NgModule } from '@angular/core';
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
import { provideHttpClient } from '@angular/common/http';
import { CardControlsComponent, NavTabsComponent } from '@save-app/ui';
import { CardCreator, InputHostComponent, SelectedCollectionCardCreator } from '@save-app/feature-inputs';
import { CardComponent, CardsViewComponent } from '@save-app/feature-cards';
import { CollectionModernComponent, CollectionViewModernComponent } from '@save-app/feature-collections';
import { CACHE_DATABASE, CacheKeyValueDB, provideDataAccess } from '@save-app/data-access';


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
    { provide: CardCreator, useExisting: SelectedCollectionCardCreator },
    provideHttpClient(),
    provideDataAccess({ apiBaseUrl: environment.apiBaseUrl })
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
