import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardManagerService } from 'src/app/desktop-view-modern/dashboard-manager.service';
import { Collection } from 'src/app/types';

@Component({
  selector: 'collections-ui-collections-view',
  templateUrl: './collections-view.component.html',
  styleUrl: './collections-view.component.scss',
})
export class CollectionsViewComponent {
  @Input() collections!: Observable<Collection[]>;

  constructor(private dashboardManagerService: DashboardManagerService) {}

  protected get selectedCollection(): string {
    return this.dashboardManagerService.selectedCollection?.id ?? '';
  }
}
