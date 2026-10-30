import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeatureCollectionsComponent } from './feature-collections.component';

describe('FeatureCollectionsComponent', () => {
  let component: FeatureCollectionsComponent;
  let fixture: ComponentFixture<FeatureCollectionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureCollectionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureCollectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
