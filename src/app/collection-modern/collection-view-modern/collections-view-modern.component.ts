import { Component, Input } from '@angular/core';
import { Collection } from '../../types';
import { Observable } from 'rxjs';
import { DashboardManagerService } from '../../desktop-view/dashboard-manager.service';

@Component({
  selector: 'collections-ui-collections-view-modern',
  templateUrl: './collections-view-modern.component.html',
  styleUrl: './collections-view-modern.component.scss',
})
export class CollectionViewModernComponent {
    @Input() collections!: Observable<Collection[]>;
  
    constructor(private dashboardManagerService: DashboardManagerService) {}
  
    protected get selectedCollection(): string {
      return this.dashboardManagerService.selectedCollection.id;
    }
}
