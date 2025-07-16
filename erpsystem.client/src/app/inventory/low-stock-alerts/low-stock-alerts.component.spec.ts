import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LowStockAlertsComponent } from './low-stock-alerts.component';

describe('LowStockAlertsComponent', () => {
  let component: LowStockAlertsComponent;
  let fixture: ComponentFixture<LowStockAlertsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LowStockAlertsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LowStockAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
