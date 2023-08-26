import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
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
import { NgComponentOutlet } from '@angular/common';
import { CheckboxInputComponent } from './inputs/checkbox-input/checkbox-input.component';
import { ImageInputComponent } from './inputs/image-input/image-input.component';
import { LinkInputComponent } from './inputs/link-input/link-input.component';
import { CollectionComponent } from './collection/collection.component';

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
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    DragDropModule,
    RouterModule.forRoot(routes, { initialNavigation: 'enabledBlocking' }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
