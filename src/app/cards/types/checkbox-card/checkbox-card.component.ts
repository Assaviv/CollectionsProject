import { Component } from '@angular/core';
import { CardBuilderComponent } from '../../card-builder-component/card-builder-component';
import { DashboardManagerService } from 'src/app/desktop-view/dashboard-manager.service';

@Component({
  selector: 'collections-ui-checkbox-card',
  templateUrl: './checkbox-card.component.html',
  styleUrls: ['./checkbox-card.component.scss'],
})
export class CheckboxCardComponent extends CardBuilderComponent {
  public changeState() {
    this.card.value = !this.card.value;
    this.dashboardManagerService.currentCardsService?.updateCard(this.card);
  }
}
