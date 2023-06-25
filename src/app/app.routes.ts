import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DesktopViewComponent } from './desktop-view/desktop-view.component';

export const routes: Route[] = [
    { path: '', component: DesktopViewComponent },
    { path: 'login', component: LoginComponent },
    { path: 'home', component: DesktopViewComponent },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
  })
  export class AppRoutingModule { }