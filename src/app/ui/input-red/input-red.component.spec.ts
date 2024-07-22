import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputRedComponent } from './input-red.component';

describe('InputRedComponent', () => {
  let component: InputRedComponent;
  let fixture: ComponentFixture<InputRedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputRedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InputRedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
