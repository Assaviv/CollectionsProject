import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DesktopViewModernComponent } from './desktop-view-modern/desktop-view-modern.component';

export const routes: Route[] = [
  { path: '', component: DesktopViewModernComponent },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: DesktopViewModernComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
