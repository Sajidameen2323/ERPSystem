import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CombinedDashboardComponent } from './combined-dashboard.component';

describe('CombinedDashboardComponent', () => {
  let component: CombinedDashboardComponent;
  let fixture: ComponentFixture<CombinedDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CombinedDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CombinedDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
