import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../api.service';
import { AuthService } from '../auth.service';
import { OfflineCacheService } from '../offline-cache.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-patient',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './patient.component.html',
  styleUrls: ['./patient.component.css']
})
export class PatientComponent implements OnInit {
  reservations: any[] = [];
  loading = false;
  offline = false;
  contactLookup = '';
  filterStatus = 'all';
  email = '';
  guestConnected = false;

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private offlineCache: OfflineCacheService
  ) {}

  ngOnInit(): void {
    this.email = this.auth.getEmail() || '';
    this.contactLookup = this.email;
    this.guestConnected = !!(this.auth.getEmail() && !this.auth.isLoggedIn());
    this.loadReservations();
  }

  loadReservations(): void {
    this.loading = true;
    this.offline = !this.offlineCache.isOnline;

    const contact = this.auth.getCurrentRole() ? undefined : (this.contactLookup || undefined);

    this.api.getPatientReservations(contact).subscribe({
      next: (data) => {
        this.reservations = data || [];
        this.offlineCache.save('patient-reservations', this.reservations);
        this.loading = false;
        this.offline = false;
      },
      error: () => {
        const cached = this.offlineCache.load<any[]>('patient-reservations');
        if (cached?.data) {
          this.reservations = cached.data;
          this.offline = true;
        } else {
          this.reservations = [];
        }
        this.loading = false;
      }
    });
  }

  lookupByContact(): void {
    if (!this.contactLookup.trim()) return;
    this.loading = true;
    this.api.getPatientReservations(this.contactLookup.trim()).subscribe({
      next: (data) => {
        this.reservations = data || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire('Info', 'Aucune réservation trouvée pour ce contact.', 'info');
      }
    });
  }

  signInAsGuest(): void {
    // allow sign-in even without contact (anonymous)
    const contact = this.contactLookup && this.contactLookup.trim() ? this.contactLookup.trim() : undefined;
    this.auth.connectAsGuest(contact);
    this.guestConnected = true;
    if (!contact) {
      this.contactLookup = this.auth.getGuestId() || 'Invité';
    }
    Swal.fire('Bienvenue', 'Vous êtes connecté en tant que patient (invité).', 'success');
    this.loadReservations();
  }

  signOutGuest(): void {
    this.auth.disconnectGuest();
    this.guestConnected = false;
    this.contactLookup = '';
    this.reservations = [];
  }

  filtered(): any[] {
    if (this.filterStatus === 'all') return this.reservations;
    return this.reservations.filter(r => r.status === this.filterStatus);
  }

  statusClass(status: string): string {
    switch (status) {
      case 'CONFIRMED': return 'success';
      case 'COMPLETED': return 'success';
      case 'PENDING': return 'warning';
      case 'CANCELLED':
      case 'EXPIRED': return 'danger';
      default: return 'warning';
    }
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmée',
      COMPLETED: 'Terminée',
      CANCELLED: 'Annulée',
      EXPIRED: 'Expirée'
    };
    return map[status] || status;
  }

  paymentLabel(r: any): string {
    if (r.paymentStatus === 'PAID') return 'Payé';
    if (r.paymentStatus === 'PENDING') return 'Paiement en cours';
    if (r.paymentStatus === 'FAILED') return 'Échec paiement';
    if (r.paymentMethod === 'ORANGE_MONEY') return 'Orange Money';
    if (r.paymentMethod === 'AIRTEL_MONEY') return 'Airtel Money';
    return 'Paiement en pharmacie';
  }

  confirmPayment(r: any): void {
    this.api.confirmPayment({ reservationId: r.id, success: true }).subscribe({
      next: () => {
        r.paymentStatus = 'PAID';
        Swal.fire('Succès', 'Paiement Mobile Money confirmé.', 'success');
      },
      error: () => Swal.fire('Erreur', 'Impossible de confirmer le paiement.', 'error')
    });
  }

  chatOpen: any = null;
  chatMessages: any[] = [];
  chatDraft = '';
  private chatPoll?: any;

  openChat(r: any): void {
    this.chatOpen = r;
    this.chatDraft = '';
    this.refreshChat();
    if (this.chatPoll) clearInterval(this.chatPoll);
    this.chatPoll = setInterval(() => this.refreshChat(), 4000);
  }

  closeChat(): void {
    this.chatOpen = null;
    this.chatMessages = [];
    if (this.chatPoll) {
      clearInterval(this.chatPoll);
      this.chatPoll = undefined;
    }
  }

  refreshChat(): void {
    if (!this.chatOpen) return;
    this.api.getReservationChat(this.chatOpen.id).subscribe({
      next: (msgs) => this.chatMessages = msgs || [],
      error: () => undefined
    });
  }

  sendChat(): void {
    if (!this.chatOpen || !this.chatDraft.trim()) return;
    this.api.sendReservationChat(this.chatOpen.id, {
      content: this.chatDraft.trim(),
      senderRole: 'PATIENT',
      senderName: this.chatOpen.patientName || 'Patient'
    }).subscribe({
      next: () => {
        this.chatDraft = '';
        this.refreshChat();
      },
      error: () => Swal.fire('Erreur', 'Envoi impossible.', 'error')
    });
  }

  get prescriptions(): any[] {
    return this.reservations.filter(r => r.prescriptionBase64);
  }
}
