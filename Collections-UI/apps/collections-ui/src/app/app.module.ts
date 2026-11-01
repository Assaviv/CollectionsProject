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
import { LinkInputComponent } from './inputs/link-input/link-input.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ImageInputComponent } from './inputs/image-input/image-input.component';
import { StoryInputComponent } from './inputs/story-input/story-input.component';
import { CardControlsComponent } from '@save-app/ui';
import { SubjectInputComponent } from './inputs/subject-input/subject-input.component';
import { CheckboxInputComponent } from './inputs/checkbox-input/checkbox-input.component';
import { KeyValueInputComponent } from './inputs/key-value-input/key-value-input.component';
import { provideHttpClient } from '@angular/common/http';
import { CardsViewComponent } from './cards/cards-view/cards-view.component';
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
import { CardComponent, SubjectCardComponent, ImageCardComponent, StoryCardComponent, CheckboxCardComponent, CardBuilderComponent, LinkCardComponent, KeyValueCardComponent } from '@save-app/feature-cards';


@NgModule({
  declarations: [
    // General
    AppComponent,
    LoginComponent,
    DesktopViewModernComponent,
    NavbarComponent,
    // Cards
    CardsViewComponent,
    // Inputs
    SubjectInputComponent,
    StoryInputComponent,
    KeyValueInputComponent,
    CheckboxInputComponent,
    ImageInputComponent,
    LinkInputComponent,
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
// TODO after removeing archive somethings failed check iut out