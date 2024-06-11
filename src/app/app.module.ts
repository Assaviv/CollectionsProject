import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSliderModule } from '@angular/material/slider';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { AppComponent } from './main/app.component';
import { routes } from './app.routes';
import { LoginComponent } from './login/login.component';
import { ReactiveFormsModule } from '@angular/forms';
import { DesktopViewComponent } from './desktop-view/desktop-view.component';
import { StoryCardComponent } from './cards/story-card/story-card.component';
import { SubjectCardComponent } from './cards/subject-card/subject-card.component';
import { KeyValueCardComponent } from './cards/key-value-card/key-value-card.component';
import { SubjectInputComponent } from './inputs/subject-input/subject-input.component';
import { NavbarComponent } from './navbar/navbar.component';
import { CardComponent } from './cards/card-component';
import { CardBuilderComponent } from './cards/card-builder-component';
import { CheckboxCardComponent } from './cards/checkbox-card/checkbox-card.component';
import { LinkCardComponent } from './cards/link-card/link-card.component';
import { ImageCardComponent } from './cards/image-card/image-card.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { InputBuilderComponent } from './inputs/input-builder-component';
import { StoryInputComponent } from './inputs/story-input/story-input.component';
import { KeyValueInputComponent } from './inputs/key-value-input/key-value-input.component';
import { CheckboxInputComponent } from './inputs/checkbox-input/checkbox-input.component';
import { ImageInputComponent } from './inputs/image-input/image-input.component';
import { LinkInputComponent } from './inputs/link-input/link-input.component';
import { CollectionComponent } from './collection/collection.component';
import { CollectionPopupComponent } from './collection-popup/collection-popup.component';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { MatFormFieldModule } from '@angular/material/form-field';
import { EmojiBoxComponent } from './emoji-box/emoji-box.component';
import { CACHE_DATABASE } from './database/database';
import { CacheKeyValueDB } from './database/cache-db';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DesktopViewComponent,
    StoryCardComponent,
    SubjectCardComponent,
    KeyValueCardComponent,
    SubjectInputComponent,
    NavbarComponent,
    CardComponent,
    CardBuilderComponent,
    InputBuilderComponent,
    CheckboxCardComponent,
    LinkCardComponent,
    ImageCardComponent,
    StoryInputComponent,
    KeyValueInputComponent,
    CheckboxInputComponent,
    ImageInputComponent,
    LinkInputComponent,
    CollectionComponent,
    CollectionPopupComponent,
    EmojiBoxComponent,
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
    RouterModule.forRoot(routes, { initialNavigation: 'enabledBlocking' }),
  ],
  providers: [
    {
      provide: CACHE_DATABASE,
      useClass: CacheKeyValueDB,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
