import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserInfoCellRendererComponent } from './user-info-cell-renderer.component';

describe('UserInfoCellRendererComponent', () => {
  let component: UserInfoCellRendererComponent;
  let fixture: ComponentFixture<UserInfoCellRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserInfoCellRendererComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserInfoCellRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
