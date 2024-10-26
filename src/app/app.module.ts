import { routes } from './app.routes';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppComponent } from './main/app.component';
import { CACHE_DATABASE } from './database/database';
import { CacheKeyValueDB } from './database/cache-db';
import { MatIconModule } from '@angular/material/icon';
import { CardComponent } from './cards/card-component';
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
import { EmojiBoxComponent } from './emoji-box/emoji-box.component';
import { ToolBoxComponent } from './cards/tool-box/tool-box.component';
import { CollectionComponent } from './collection/collection.component';
import { DesktopViewComponent } from './desktop-view/desktop-view.component';
import { LinkInputComponent } from './inputs/link-input/link-input.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LinkCardComponent } from './cards/types/link-card/link-card.component';
import { ImageInputComponent } from './inputs/image-input/image-input.component';
import { StoryInputComponent } from './inputs/story-input/story-input.component';
import { ImageCardComponent } from './cards/types/image-card/image-card.component';
import { StoryCardComponent } from './cards/types/story-card/story-card.component';
import { CardControlsComponent } from './cards/card-controls/card-controls.component';
import { SubjectInputComponent } from './inputs/subject-input/subject-input.component';
import { CollectionPopupComponent } from './collection-popup/collection-popup.component';
import { SubjectCardComponent } from './cards/types/subject-card/subject-card.component';
import { CheckboxInputComponent } from './inputs/checkbox-input/checkbox-input.component';
import { KeyValueInputComponent } from './inputs/key-value-input/key-value-input.component';
import { CheckboxCardComponent } from './cards/types/checkbox-card/checkbox-card.component';
import { CardBuilderComponent } from './cards/card-builder-component/card-builder-component';
import { KeyValueCardComponent } from './cards/types/key-value-card/key-value-card.component';
import { provideHttpClient } from '@angular/common/http';
import { CardsViewComponent } from './cards/cards-view/cards-view.component';
import { CollectionsViewComponent } from './collection/collections-view/collections-view.component';

@NgModule({
  declarations: [
    // General
    AppComponent,
    LoginComponent,
    DesktopViewComponent,
    NavbarComponent,
    // Cards
    CardComponent,
    CardBuilderComponent,
    SubjectCardComponent,
    StoryCardComponent,
    KeyValueCardComponent,
    CheckboxCardComponent,
    LinkCardComponent,
    ImageCardComponent,
    ToolBoxComponent,
    CardControlsComponent,
    CardsViewComponent,
    // Inputs
    SubjectInputComponent,
    StoryInputComponent,
    KeyValueInputComponent,
    CheckboxInputComponent,
    ImageInputComponent,
    LinkInputComponent,
    // Collection
    CollectionComponent,
    CollectionPopupComponent,
    EmojiBoxComponent,
    CollectionsViewComponent,
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
  ],
  providers: [
    {
      provide: CACHE_DATABASE,
      useClass: CacheKeyValueDB,
    },
    provideHttpClient(),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
