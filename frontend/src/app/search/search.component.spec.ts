import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { SearchComponent } from './search.component';

describe('SearchComponent', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should select the closest pharmacy from the nearest list', () => {
    component.userLat = 12.1131;
    component.userLng = 15.0491;

    const list = [
      { id: 1, name: 'Pharmacie A', latitude: 12.1200, longitude: 15.0500 },
      { id: 2, name: 'Pharmacie B', latitude: 12.2000, longitude: 15.1000 },
      { id: 3, name: 'Pharmacie C', latitude: 12.3000, longitude: 15.2000 }
    ];

    expect(component.getClosestPharmacy(list)?.id).toBe(1);
  });

  it('should highlight the closest pharmacy that has the medication in stock', () => {
    component.allResults = [
      { pharmacy: { id: 1, name: 'Loin', latitude: 12.2, longitude: 15.1 }, stock: { quantity: 20 }, distanceKm: 8 },
      { pharmacy: { id: 2, name: 'Proche mais vide', latitude: 12.11, longitude: 15.05 }, stock: { quantity: 0 }, distanceKm: 0.5 },
      { pharmacy: { id: 3, name: 'Proche', latitude: 12.12, longitude: 15.05 }, stock: { quantity: 5 }, distanceKm: 1.2 }
    ];
    component.maxDistance = null as any;
    component.applyFilters();
    expect(component.closestResult?.pharmacy.name).toBe('Proche');
  });
});
