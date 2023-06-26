import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AppComponent } from './main/app.component';
import { routes } from './app.routes';
import { LoginComponent } from './login/login.component';
import { ReactiveFormsModule } from '@angular/forms';
import { DesktopViewComponent } from './desktop-view/desktop-view.component';
import { StoryCardComponent } from './cards/story-card/story-card.component';
import { SubjectCardComponent } from './cards/subject-card/subject-card.component';
import { KeyValueCardComponent } from './cards/key-value-card/key-value-card.component';
import { SubjectInputComponent } from './subject-input/subject-input.component';
import { NavbarComponent } from './navbar/navbar.component';
import { CardComponent } from './cards/card-component';
import { CardBuilderComponent } from './cards/card-builder-component';

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
    CardBuilderComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    RouterModule.forRoot(routes, { initialNavigation: 'enabledBlocking' }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
