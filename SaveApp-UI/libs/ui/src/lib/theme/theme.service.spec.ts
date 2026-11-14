import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  it('starts with the modern background', () => {
    expect(service.bgcolor()).toBe('modern-bg');
  });

  it('updates the background through the setter', () => {
    service.setBgcolor = 'elemental-dark';

    expect(service.bgcolor()).toBe('elemental-dark');
  });
});
