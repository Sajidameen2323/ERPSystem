import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockAdjustmentModalComponent } from './stock-adjustment-modal.component';

describe('StockAdjustmentModalComponent', () => {
  let component: StockAdjustmentModalComponent;
  let fixture: ComponentFixture<StockAdjustmentModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockAdjustmentModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StockAdjustmentModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
