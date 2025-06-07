import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinalReceiptComponent } from './final-receipt.component';

describe('FinalReceiptComponent', () => {
  let component: FinalReceiptComponent;
  let fixture: ComponentFixture<FinalReceiptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinalReceiptComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinalReceiptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
