import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-pharmacy-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container animate-fade-in" style="padding-top: 80px; max-width: 900px; margin: 0 auto;">
      
      <button class="btn btn-secondary" style="margin-bottom: 20px;" routerLink="/search">
        <i class="fa-solid fa-arrow-left"></i> Retour à la recherche
      </button>

      <div class="loading" *ngIf="loading">Chargement des détails...</div>
      
      <div class="glass-panel" *ngIf="pharmacy && !loading">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px; margin-bottom: 15px;">
          <div>
            <h1 style="font-size: 2rem; margin-bottom: 5px;">{{ pharmacy.name }}</h1>
            <span class="badge" [ngClass]="pharmacy.isOnCall ? 'danger' : 'success'">
              {{ pharmacy.isOnCall ? 'Pharmacie de garde' : 'Ouverte (Horaires normaux)' }}
            </span>
          </div>
          <div>
            <a class="btn btn-primary" [href]="'tel:' + pharmacy.contact">
              <i class="fa-solid fa-phone"></i> Appeler
            </a>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
          <div>
            <h3 style="color: var(--primary); margin-bottom: 10px;">Informations de contact</h3>
            <p><i class="fa-solid fa-map-location-dot"></i> <strong>Adresse :</strong> {{ pharmacy.address }}</p>
            <p><i class="fa-solid fa-phone"></i> <strong>Téléphone :</strong> {{ pharmacy.contact }}</p>
            <p><i class="fa-solid fa-envelope"></i> <strong>Email :</strong> {{ pharmacy.owner?.email || 'Non renseigné' }}</p>
          </div>
          <div>
            <h3 style="color: var(--primary); margin-bottom: 10px;">Coordonnées GPS</h3>
            <p><strong>Latitude :</strong> {{ pharmacy.latitude }}</p>
            <p><strong>Longitude :</strong> {{ pharmacy.longitude }}</p>
            <button class="btn btn-secondary btn-compact" style="margin-top: 10px;" (click)="openMap()">
              <i class="fa-solid fa-map"></i> Voir sur Google Maps
            </button>
          </div>
        </div>
        
        <div style="background: rgba(0,0,0,0.1); padding: 20px; border-radius: 12px;">
          <h3 style="margin-bottom: 15px;">Services disponibles (PharmaSync)</h3>
          <ul style="list-style: none; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <li><i class="fa-solid fa-check text-success"></i> Recherche de médicaments</li>
            <li><i class="fa-solid fa-check text-success"></i> Réservation en ligne</li>
            <li><i class="fa-solid fa-check text-success"></i> Alerte de réapprovisionnement</li>
            <li><i class="fa-solid fa-check text-success"></i> Géolocalisation</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .text-success { color: #22c55e; margin-right: 8px; }
  `]
})
export class PharmacyDetailComponent implements OnInit {
  pharmacy: any;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.apiService.request('GET', `pharmacy/${id}`).subscribe({
        next: (data) => {
          this.pharmacy = data;
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
        }
      });
    }
  }

  openMap(): void {
    if (this.pharmacy) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${this.pharmacy.latitude},${this.pharmacy.longitude}`, '_blank');
    }
  }
}
