import { routes } from './app.routes';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppComponent } from './main/app.component';
import { MatIconModule } from '@angular/material/icon';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { LoginComponent } from './login/login.component';
import { MatChipsModule } from '@angular/material/chips';
import { BrowserModule } from '@angular/platform-browser';
import { MatSliderModule } from '@angular/material/slider';
import { MatDialogModule } from '@angular/material/dialog';
import { NavbarComponent } from './navbar/navbar.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CardControlsComponent } from '@save-app/ui';
import { provideHttpClient } from '@angular/common/http';
import { CardsViewComponent } from './cards-view/cards-view.component';
import { DesktopViewModernComponent } from './desktop-view-modern/desktop-view-modern.component';
import { CollectionModernComponent } from './collection-modern/collection-modern.component';
import { CollectionViewModernComponent } from './collection-modern/collection-view-modern/collections-view-modern.component';
import { CollectionToolbarComponent } from './collection-modern/collection-view-modern/collection-toolbar/collection-toolbar.component';
import { CollectionCreateFormComponent } from './collection-modern/collection-view-modern/collection-create-form/collection-create-form.component';
import { SideBarComponent } from './side-bar/side-bar.component';
import { CollectionAnalyticsComponent } from './collection-analytics/collection-analytics.component';
import { VectorSearchComponent } from './vector-search/vector-search.component';
import { CACHE_DATABASE, CacheKeyValueDB, provideDataAccess } from '@save-app/data-access';
import { environment } from 'src/environments/environments';
import { CardCreator } from '@save-app/feature-cards';
import { SelectedCollectionCardCreator } from './desktop-view-modern/selected-collection-card-creator';
import { CardComponent } from '@save-app/feature-cards';
import { InputHostComponent } from '@save-app/feature-inputs';


@NgModule({
  declarations: [
    // General
    AppComponent,
    LoginComponent,
    DesktopViewModernComponent,
    NavbarComponent,
    // Cards
    CardsViewComponent,
    // Collection
    CollectionModernComponent,
    CollectionViewModernComponent,
    CollectionToolbarComponent,
    CollectionCreateFormComponent,
    SideBarComponent,
    CollectionAnalyticsComponent,
    VectorSearchComponent,
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
