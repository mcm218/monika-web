import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DesktopAuthComponent } from './desktop-auth.component';

describe('DesktopAuthComponent', () => {
  let component: DesktopAuthComponent;
  let fixture: ComponentFixture<DesktopAuthComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DesktopAuthComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DesktopAuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
