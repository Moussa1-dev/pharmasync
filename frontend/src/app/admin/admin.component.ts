import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import Swal from 'sweetalert2';



@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  pharmacies: any[] = [];
  selectedPharmacy: any = null;
  showForm = false;
  formMode: 'create' | 'edit' = 'create';

  pharmacyForm = {
    name: '',
    address: '',
    contact: '',
    latitude: 0,
    longitude: 0,
    isOnCall: false
  };

  showBroadcastForm = false;
  broadcastForm = {
    title: '',
    message: ''
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadPharmacies();
  }

  loadPharmacies(): void {
    this.apiService.getAllPharmacies().subscribe({
      next: (data) => this.pharmacies = data,
      error: (err) => console.error(err)
    });
  }

  openCreate(): void {
    this.formMode = 'create';
    this.selectedPharmacy = null;
    this.pharmacyForm = { name: '', address: '', contact: '', latitude: 0, longitude: 0, isOnCall: false };
    this.showForm = true;
  }

  openEdit(pharmacy: any): void {
    this.formMode = 'edit';
    this.selectedPharmacy = pharmacy;
    this.pharmacyForm = {
      name: pharmacy.name,
      address: pharmacy.address,
      contact: pharmacy.contact,
      latitude: pharmacy.latitude ?? 0,
      longitude: pharmacy.longitude ?? 0,
      isOnCall: pharmacy.isOnCall ?? false
    };
    this.showForm = true;
  }

  cancel(): void {
    this.showForm = false;
    this.selectedPharmacy = null;
  }

  save(): void {
    if (this.formMode === 'create') {
      this.apiService.createPharmacy(this.pharmacyForm).subscribe({
        next: () => {
          this.loadPharmacies();
          this.cancel();
        },
        error: (err) => console.error(err)
      });
    } else if (this.selectedPharmacy) {
      this.apiService.updatePharmacy(this.selectedPharmacy.id, this.pharmacyForm).subscribe({
        next: () => {
          this.loadPharmacies();
          this.cancel();
        },
        error: (err) => console.error(err)
      });
    }
  }

  deletePharmacy(pharmacy: any): void {
    if (!confirm(`Supprimer ${pharmacy.name} ?`)) return;

    this.apiService.deletePharmacy(pharmacy.id).subscribe({
      next: () => this.loadPharmacies(),
      error: (err) => console.error(err)
    });
  }

  openBroadcast(): void {
    this.broadcastForm = { title: '', message: '' };
    this.showBroadcastForm = true;
  }

  cancelBroadcast(): void {
    this.showBroadcastForm = false;
  }

  sendBroadcast(): void {
    if (!this.broadcastForm.title || !this.broadcastForm.message) {
      Swal.fire('Erreur', 'Veuillez remplir tous les champs.', 'warning');
      return;
    }
    this.apiService.request('POST', 'notifications/broadcast', this.broadcastForm).subscribe({
      next: () => {
        Swal.fire('Succès', 'Alerte diffusée à tous les utilisateurs.', 'success');
        this.cancelBroadcast();
      },
      error: (err) => {
        Swal.fire('Erreur', 'Impossible de diffuser l\'alerte.', 'error');
        console.error(err);
      }
    });
  }
}
