import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

export type UserRole = 'admin' | 'pharmacist' | 'patient' | null;

export interface PharmacySummary {
  id: number;
  name: string;
  address?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  private roleSubject = new BehaviorSubject<UserRole>(null);
  private pharmaciesSubject = new BehaviorSubject<PharmacySummary[]>([]);
  private activePharmacySubject = new BehaviorSubject<number | null>(null);

  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  role$ = this.roleSubject.asObservable();
  pharmacies$ = this.pharmaciesSubject.asObservable();
  activePharmacyId$ = this.activePharmacySubject.asObservable();

  private apiUrl = `${environment.apiHost}/api/auth`;

  constructor(private router: Router, private http: HttpClient) {
    this.restoreSession();
  }

  private restoreSession(): void {
    const hasToken = this.isLoggedIn();
    this.isLoggedInSubject.next(hasToken);
    this.roleSubject.next(hasToken ? this.readRoleFromStorage() : null);
    if (hasToken) {
      this.pharmaciesSubject.next(this.readPharmaciesFromStorage());
      const stored = localStorage.getItem('pharma_active_pharmacy');
      this.activePharmacySubject.next(stored ? Number(stored) : this.pharmaciesSubject.value[0]?.id ?? 1);
    }
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('pharma_token');
  }

  private readRoleFromStorage(): UserRole {
    const role = localStorage.getItem('pharma_role');
    if (role === 'admin' || role === 'pharmacist' || role === 'patient') {
      return role;
    }
    return null;
  }

  private readPharmaciesFromStorage(): PharmacySummary[] {
    try {
      const raw = localStorage.getItem('pharma_pharmacies');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private clearSession(): void {
    localStorage.removeItem('pharma_token');
    localStorage.removeItem('pharma_role');
    localStorage.removeItem('pharma_email');
    localStorage.removeItem('pharma_user_id');
    localStorage.removeItem('pharma_pharmacies');
    localStorage.removeItem('pharma_active_pharmacy');
    this.pharmaciesSubject.next([]);
    this.activePharmacySubject.next(null);
  }

  getCurrentRole(): UserRole {
    return this.roleSubject.value;
  }

  getEmail(): string | null {
    return localStorage.getItem('pharma_email');
  }

  getUserId(): string | null {
    return localStorage.getItem('pharma_user_id');
  }

  getPharmacies(): PharmacySummary[] {
    return this.pharmaciesSubject.value;
  }

  getActivePharmacyId(): number {
    return this.activePharmacySubject.value ?? 1;
  }

  setActivePharmacyId(id: number): void {
    localStorage.setItem('pharma_active_pharmacy', String(id));
    // Mémorisé par compte : retrouvé à la prochaine connexion
    const email = this.getEmail();
    if (email) {
      localStorage.setItem('pharma_last_pharmacy:' + email, String(id));
    }
    this.activePharmacySubject.next(id);
  }

  getActivePharmacyName(): string {
    const id = this.getActivePharmacyId();
    return this.getPharmacies().find(p => p.id === id)?.name || 'Ma Pharmacie';
  }

  getRoleLabel(): string {
    switch (this.getCurrentRole()) {
      case 'admin': return 'Administrateur';
      case 'pharmacist': return 'Pharmacien';
      case 'patient': return 'Patient';
      default: return 'Invité';
    }
  }

  /**
   * Connecte un patient en mode invité (sans token).
   * Stocke l'email / contact localement pour pré-remplir les formulaires
   * et permettre la consultation des réservations liées à ce contact.
   */
  connectAsGuest(emailOrContact?: string): void {
    // If an email/phone is provided, store it for prefill. Otherwise create a transient guest id.
    if (emailOrContact && emailOrContact.trim()) {
      localStorage.setItem('pharma_email', emailOrContact.trim());
      localStorage.removeItem('pharma_guest_id');
    } else {
      // create a lightweight guest id so the UI can show "Invité"
      const gid = 'guest-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
      localStorage.setItem('pharma_guest_id', gid);
      localStorage.removeItem('pharma_email');
    }
    // remain unauthenticated but expose guest state
    this.isLoggedInSubject.next(false);
    this.roleSubject.next(null);
  }

  disconnectGuest(): void {
    localStorage.removeItem('pharma_email');
    localStorage.removeItem('pharma_guest_id');
    this.isLoggedInSubject.next(false);
    this.roleSubject.next(null);
  }

  getGuestId(): string | null {
    return localStorage.getItem('pharma_guest_id');
  }

  isPharmacistOrAdmin(): boolean {
    const role = this.getCurrentRole();
    return role === 'pharmacist' || role === 'admin';
  }

  isAdmin(): boolean {
    return this.getCurrentRole() === 'admin';
  }

  isPatient(): boolean {
    return this.getCurrentRole() === 'patient';
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/signin`, { email, password }).pipe(
      tap((response: any) => {
        if (response && response.token) {
          localStorage.setItem('pharma_token', response.token);
          localStorage.setItem('pharma_email', response.email || email);
          if (response.id != null) {
            localStorage.setItem('pharma_user_id', String(response.id));
          }
          let roleStr: UserRole = 'patient';
          if (response.roles && response.roles.includes('ROLE_ADMIN')) {
            roleStr = 'admin';
          } else if (response.roles && response.roles.includes('ROLE_PHARMACIEN')) {
            roleStr = 'pharmacist';
          }
          localStorage.setItem('pharma_role', roleStr);

          const pharmacies: PharmacySummary[] = (response.pharmacies || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            address: p.address
          }));
          localStorage.setItem('pharma_pharmacies', JSON.stringify(pharmacies));
          this.pharmaciesSubject.next(pharmacies);

          // Dernière pharmacie choisie par ce compte, si elle lui est toujours assignée
          const lastChoice = Number(localStorage.getItem('pharma_last_pharmacy:' + email));
          const activeId = pharmacies.some(p => p.id === lastChoice)
            ? lastChoice
            : (response.activePharmacyId || pharmacies[0]?.id || 1);
          localStorage.setItem('pharma_active_pharmacy', String(activeId));
          this.activePharmacySubject.next(activeId);

          this.isLoggedInSubject.next(true);
          this.roleSubject.next(roleStr);
        }
      })
    );
  }

  verifyEmail(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/verify-email?token=${token}`);
  }

  logout(): void {
    this.clearSession();
    this.isLoggedInSubject.next(false);
    this.roleSubject.next(null);
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  redirectAfterLogin(returnUrl?: string | null): void {
    const role = this.getCurrentRole();

    if (returnUrl && !returnUrl.startsWith('/login')) {
      this.router.navigateByUrl(returnUrl, { replaceUrl: true });
      return;
    }

    if (role === 'admin' || role === 'pharmacist') {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    } else {
      this.router.navigate(['/patient'], { replaceUrl: true });
    }
  }
}
