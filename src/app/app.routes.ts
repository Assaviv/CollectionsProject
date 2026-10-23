import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DesktopViewComponent } from './desktop-view/desktop-view.component';
import { DesktopViewModernComponent } from './desktop-view-modern/desktop-view-modern.component';

export const routes: Route[] = [
  { path: '', component: DesktopViewModernComponent },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: DesktopViewComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
