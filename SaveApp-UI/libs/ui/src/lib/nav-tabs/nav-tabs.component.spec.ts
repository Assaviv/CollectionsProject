import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavTabsComponent } from './nav-tabs.component';

describe('NavTabsComponent', () => {
  let fixture: ComponentFixture<NavTabsComponent<'grid' | 'list'>>;
  let component: NavTabsComponent<'grid' | 'list'>;

  const items = [
    { id: 'grid', label: 'Grid view', icon: '/grid.svg' },
    { id: 'list', label: 'List view', icon: '/list.svg' },
  ] as const;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavTabsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NavTabsComponent<'grid' | 'list'>);
    component = fixture.componentInstance;
    component.items = items;
    fixture.detectChanges();
  });

  it('renders labeled tabs and marks the active item as pressed', () => {
    component.active = 'list';
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;
    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;

    expect(nav.getAttribute('aria-label')).toBe('Views');
    expect(buttons).toHaveLength(2);
    expect(buttons[0].getAttribute('aria-label')).toBe('Grid view');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[1].classList).toContain('nav-tabs__button--active');
    expect(buttons[1].querySelector('img')?.getAttribute('src')).toBe('/list.svg');
  });

  it('emits the selected item id when a tab is clicked', () => {
    const selected = jest.fn();
    component.selected.subscribe(selected);
    fixture.nativeElement.querySelectorAll('button')[1].click();

    expect(selected).toHaveBeenCalledWith('list');
  });

  it('exposes the selected orientation on the host and custom aria label', () => {
    component.orientation = 'horizontal';
    component.ariaLabel = 'Collection views';
    fixture.detectChanges();

    expect(fixture.nativeElement.getAttribute('data-orientation')).toBe('horizontal');
    expect(fixture.nativeElement.querySelector('nav').getAttribute('aria-label')).toBe('Collection views');
  });
});
