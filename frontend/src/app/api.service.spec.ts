import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Vérifie qu'il n'y a pas de requêtes en attente
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch nearest pharmacies correctly', () => {
    const dummyPharmacies = [
      { id: 1, name: 'Pharmacie A', distance: 1.5 },
      { id: 2, name: 'Pharmacie B', distance: 3.2 }
    ];

    service.getNearestPharmacies(48.8566, 2.3522).subscribe(pharmacies => {
      expect(pharmacies.length).toBe(2);
      expect(pharmacies).toEqual(dummyPharmacies);
    });

    const req = httpMock.expectOne(`${service['baseUrl']}/search/nearest?lat=48.8566&lng=2.3522`);
    expect(req.request.method).toBe('GET');
    req.flush(dummyPharmacies);
  });

  it('should search medications by name', () => {
    const dummyResults = [
      { stockId: 1, medication: 'Doliprane', pharmacy: 'Pharmacie Centrale' }
    ];

    service.searchMedications('Doliprane').subscribe(results => {
      expect(results.length).toBe(1);
    });

    const req = httpMock.expectOne(`${service['baseUrl']}/search?query=Doliprane`);
    expect(req.request.method).toBe('GET');
    req.flush(dummyResults);
  });
});
