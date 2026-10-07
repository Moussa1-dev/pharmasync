import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { DashboardComponent } from './dashboard.component';
import { ApiService } from '../api.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    // Espion sur TOUTES les méthodes d'ApiService : chaque appel renvoie
    // une liste vide, pour que le composant s'initialise sans backend.
    const methods = Object.getOwnPropertyNames(ApiService.prototype)
      .filter(m => m !== 'constructor');
    apiService = jasmine.createSpyObj<ApiService>('ApiService', methods as any);
    methods.forEach(m => (apiService as any)[m].and.returnValue(of([])));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [{ provide: ApiService, useValue: apiService }, provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter inventory by stock and rupture state', () => {
    component.stocks = [
      { id: 1, quantity: 10, medication: { name: 'Doliprane' } },
      { id: 2, quantity: 0, medication: { name: 'Spasfon' } },
      { id: 3, quantity: 5, medication: { name: 'Ibuprofène' } }
    ];

    component.setInventoryFilter('stock');
    expect(component.filteredStocks.length).toBe(2);
    expect(component.filteredStocks.every(stock => stock.quantity > 0)).toBeTrue();

    component.setInventoryFilter('rupture');
    expect(component.filteredStocks.length).toBe(1);
    expect(component.filteredStocks.every(stock => stock.quantity === 0)).toBeTrue();
  });

  it('should filter inventory by medication name', () => {
    component.stocks = [
      { id: 1, quantity: 10, medication: { name: 'Doliprane' } },
      { id: 2, quantity: 0, medication: { name: 'Spasfon' } }
    ];
    component.inventorySearch = 'dol';
    component.applyInventoryFilter();

    expect(component.filteredStocks.length).toBe(1);
    expect(component.filteredStocks[0].medication.name).toBe('Doliprane');
  });
});
