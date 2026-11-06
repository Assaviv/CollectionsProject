import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { DesktopViewModernComponent } from './desktop-view-modern/desktop-view-modern.component';

export const routes: Route[] = [
  { path: '', component: DesktopViewModernComponent },
  { path: 'home', component: DesktopViewModernComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
