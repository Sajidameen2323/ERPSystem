import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductPerformanceChartComponent } from './product-performance-chart.component';

describe('ProductPerformanceChartComponent', () => {
  let component: ProductPerformanceChartComponent;
  let fixture: ComponentFixture<ProductPerformanceChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductPerformanceChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductPerformanceChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
