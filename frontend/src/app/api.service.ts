import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = `${environment.apiHost}/api`;

  constructor(private http: HttpClient) { }

  searchMedications(query: string, lat?: number, lng?: number): Observable<any> {
    let params = new HttpParams().set('query', query);
    if (lat && lng) {
      params = params.set('lat', lat.toString()).set('lng', lng.toString());
    }
    return this.http.get(`${this.baseUrl}/search`, { params });
  }

  getPharmacyStocks(pharmacyId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/pharmacy/${pharmacyId}/stocks`);
  }

  getExpiringStocks(pharmacyId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/pharmacy/${pharmacyId}/expiring`);
  }

  getPharmacySummary(pharmacyId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/pharmacy/${pharmacyId}/summary`);
  }

  getOnCallPharmacies(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/pharmacy/on-call`);
  }

  createReservation(reservation: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/reservations`, reservation);
  }

  getPharmacyReservations(pharmacyId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/pharmacy/${pharmacyId}/reservations`);
  }

  updateReservationStatus(reservationId: number, status: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/reservations/${reservationId}/status`, { status });
  }

  updateStock(stockId: number, quantity: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/pharmacy/stocks/${stockId}`, { quantity });
  }

  getAllMedications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/pharmacy/medications`);
  }

  addStock(pharmacyId: number, stockData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/pharmacy/${pharmacyId}/stocks`, stockData);
  }

  getAllPharmacies(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/pharmacy`);
  }

  createPharmacy(pharmacy: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/pharmacy`, pharmacy);
  }

  updatePharmacy(pharmacyId: number, pharmacy: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/pharmacy/${pharmacyId}`, pharmacy);
  }

  deletePharmacy(pharmacyId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/pharmacy/${pharmacyId}`);
  }

  createMedication(medication: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/medications`, medication);
  }

  updateMedication(medicationId: number, medication: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/medications/${medicationId}`, medication);
  }

  deleteMedication(medicationId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/medications/${medicationId}`);
  }

  getSuppliers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/suppliers`);
  }

  createSupplier(supplier: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/suppliers`, supplier);
  }

  updateSupplier(supplierId: number, supplier: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/suppliers/${supplierId}`, supplier);
  }

  deleteSupplier(supplierId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/suppliers/${supplierId}`);
  }

  getNearestPharmacies(lat: number, lng: number): Observable<any[]> {
    let params = new HttpParams().set('lat', lat.toString()).set('lng', lng.toString());
    return this.http.get<any[]>(`${this.baseUrl}/search/nearest`, { params });
  }

  createSale(saleData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/sales`, saleData);
  }

  getPharmacySales(pharmacyId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/sales/pharmacy/${pharmacyId}`);
  }

  importStocks(pharmacyId: number, formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/stocks/import/${pharmacyId}`, formData, { responseType: 'text' });
  }

  getStockMovements(pharmacyId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/stocks/movements/${pharmacyId}`);
  }

  suggestMedications(q: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/search/suggest`, {
      params: new HttpParams().set('q', q)
    });
  }

  searchMedicationsSmart(
    query: string,
    opts: {
      lat?: number;
      lng?: number;
      maxDistance?: number | null;
      onCallOnly?: boolean;
      inStockOnly?: boolean;
      maxPrice?: number | null;
    } = {}
  ): Observable<any> {
    let params = new HttpParams().set('query', query);
    if (opts.lat != null && opts.lng != null) {
      params = params.set('lat', String(opts.lat)).set('lng', String(opts.lng));
    }
    if (opts.maxDistance != null) params = params.set('maxDistance', String(opts.maxDistance));
    if (opts.onCallOnly) params = params.set('onCallOnly', 'true');
    if (opts.inStockOnly) params = params.set('inStockOnly', 'true');
    if (opts.maxPrice != null) params = params.set('maxPrice', String(opts.maxPrice));
    return this.http.get(`${this.baseUrl}/search`, { params });
  }

  getNotifications(pharmacyId?: number): Observable<any[]> {
    let params = new HttpParams();
    if (pharmacyId != null) params = params.set('pharmacyId', String(pharmacyId));
    return this.http.get<any[]>(`${this.baseUrl}/notifications/me`, { params });
  }

  markNotificationRead(id: number, pharmacyId?: number): Observable<any> {
    let params = new HttpParams();
    if (pharmacyId != null) params = params.set('pharmacyId', String(pharmacyId));
    return this.http.put(`${this.baseUrl}/notifications/${id}/read`, {}, { params });
  }

  markAllNotificationsRead(pharmacyId?: number): Observable<any> {
    let params = new HttpParams();
    if (pharmacyId != null) params = params.set('pharmacyId', String(pharmacyId));
    return this.http.put(`${this.baseUrl}/notifications/me/read-all`, {}, { params });
  }

  getPatientReservations(contact?: string): Observable<any[]> {
    let params = new HttpParams();
    if (contact) params = params.set('contact', contact);
    return this.http.get<any[]>(`${this.baseUrl}/patient/reservations`, { params });
  }

  getStockAlerts(pharmacyId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/pharmacy/${pharmacyId}/alerts`);
  }

  getSupplierOrders(pharmacyId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/supplier-orders/pharmacy/${pharmacyId}`);
  }

  createSupplierOrder(order: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/supplier-orders`, order);
  }

  createOrderFromAlert(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/supplier-orders/from-alert`, payload);
  }

  updateSupplierOrderStatus(id: number, status: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/supplier-orders/${id}/status`, { status });
  }

  findMedicationByBarcode(code: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/medications/by-barcode/${encodeURIComponent(code)}`);
  }

  findStockByBarcode(pharmacyId: number, code: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/pharmacy/${pharmacyId}/stocks/by-barcode/${encodeURIComponent(code)}`);
  }

  initPayment(payload: { reservationId: number; provider: string; phoneNumber: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/payments/init`, payload);
  }

  confirmPayment(payload: { externalReference?: string; reservationId?: number; success?: boolean }): Observable<any> {
    return this.http.post(`${this.baseUrl}/payments/confirm`, payload);
  }

  getPaymentByReservation(reservationId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/payments/reservation/${reservationId}`);
  }

  getDutySchedules(params?: { start?: string; end?: string; pharmacyId?: number }): Observable<any[]> {
    let httpParams = new HttpParams();
    if (params?.start) httpParams = httpParams.set('start', params.start);
    if (params?.end) httpParams = httpParams.set('end', params.end);
    if (params?.pharmacyId != null) httpParams = httpParams.set('pharmacyId', String(params.pharmacyId));
    return this.http.get<any[]>(`${this.baseUrl}/duty-schedules`, { params: httpParams });
  }

  createDutySchedule(duty: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/duty-schedules`, duty);
  }

  updateDutySchedule(id: number, duty: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/duty-schedules/${id}`, duty);
  }

  deleteDutySchedule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/duty-schedules/${id}`);
  }

  getOnCallNow(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/duty-schedules/on-call-now`);
  }

  getMyPharmacies(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/me/pharmacies`);
  }

  getReservationChat(reservationId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/reservations/${reservationId}/chat`);
  }

  sendReservationChat(reservationId: number, payload: { content: string; senderRole: string; senderName?: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/reservations/${reservationId}/chat`, payload);
  }

  traceByLot(lotNumber: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/traceability/lot/${encodeURIComponent(lotNumber)}`);
  }

  getRecalls(pharmacyId?: number): Observable<any[]> {
    let params = new HttpParams();
    if (pharmacyId != null) params = params.set('pharmacyId', String(pharmacyId));
    return this.http.get<any[]>(`${this.baseUrl}/traceability/recalls`, { params });
  }

  createRecall(payload: { lotNumber: string; reason: string; pharmacyId?: number; createdBy?: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/traceability/recalls`, payload);
  }

  closeRecall(id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/traceability/recalls/${id}/close`, {});
  }

  subscribeToRestockAlert(payload: { medicationId: number; pharmacyId?: number }): Observable<any> {
    return this.http.post(`${this.baseUrl}/notifications/subscribe`, payload);
  }

  request(method: string, endpoint: string, body?: any): Observable<any> {
    return this.http.request(method, `${this.baseUrl}/${endpoint}`, { body });
  }
}
