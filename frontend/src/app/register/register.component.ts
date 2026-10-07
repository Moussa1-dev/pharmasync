import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../api.service';

/** Création d'un compte patient (suivi des réservations, alertes de disponibilité). */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-box">
        <h2 class="auth-title">Créer un compte patient</h2>
        <p class="auth-subtitle">Pour suivre vos réservations et recevoir les alertes de disponibilité.</p>

        <div *ngIf="successMessage" class="alert alert-success">{{ successMessage }}</div>
        <div *ngIf="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>

        <!-- Démo : pas de vrai e-mail, le lien d'activation s'affiche ici -->
        <button *ngIf="verifyToken" type="button" class="btn btn-accent btn-block" (click)="activate()">
          Activer mon compte maintenant (démonstration)
        </button>

        <form *ngIf="!successMessage" (ngSubmit)="onSubmit()" #registerForm="ngForm">
          <div class="form-group">
            <label>Nom</label>
            <input type="text" class="form-control" name="nom" [(ngModel)]="nom" required>
          </div>
          <div class="form-group">
            <label>Prénom</label>
            <input type="text" class="form-control" name="prenom" [(ngModel)]="prenom">
          </div>
          <div class="form-group">
            <label>Téléphone</label>
            <input type="tel" class="form-control" name="telephone" [(ngModel)]="telephone" placeholder="Ex. 66 00 00 00">
          </div>
          <div class="form-group">
            <label>Adresse e-mail</label>
            <input type="email" class="form-control" name="email" [(ngModel)]="email" required email>
          </div>
          <div class="form-group">
            <label>Mot de passe (6 caractères minimum)</label>
            <input type="password" class="form-control" name="password" [(ngModel)]="password" required minlength="6">
          </div>
          <div class="form-group">
            <label>Confirmer le mot de passe</label>
            <input type="password" class="form-control" name="confirm" [(ngModel)]="confirm" required>
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="!registerForm.form.valid || loading">
            {{ loading ? 'Création en cours...' : 'Créer mon compte' }}
          </button>
        </form>

        <p class="auth-footer text-center mt-3">
          Déjà inscrit ? <a routerLink="/login">Se connecter</a>
        </p>
      </div>
    </div>
  `,
  styleUrls: ['../login/login.component.css']
})
export class RegisterComponent {
  nom = '';
  prenom = '';
  telephone = '';
  email = '';
  password = '';
  confirm = '';
  loading = false;
  successMessage = '';
  errorMessage = '';
  verifyToken: string | null = null;

  constructor(private api: ApiService, private router: Router) {}

  onSubmit(): void {
    this.errorMessage = '';
    if (this.password !== this.confirm) {
      this.errorMessage = 'Les deux mots de passe ne sont pas identiques.';
      return;
    }
    this.loading = true;
    this.api.request('POST', 'auth/signup', {
      nom: this.nom.trim(),
      prenom: this.prenom.trim(),
      telephone: this.telephone.trim(),
      email: this.email.trim(),
      password: this.password
    }).subscribe({
      next: (res: any) => {
        this.successMessage = res?.message || 'Compte créé. Vérifiez votre e-mail pour l\'activer.';
        this.verifyToken = res?.verifyToken || null;
        this.loading = false;
      },
      error: (err) => {
        const e = err?.error;
        this.errorMessage = (typeof e === 'string' ? e : e?.message) || 'Impossible de créer le compte.';
        if (this.errorMessage.includes('already in use')) {
          this.errorMessage = 'Cette adresse e-mail est déjà utilisée.';
        }
        this.loading = false;
      }
    });
  }

  /** La page de connexion sait déjà activer un compte avec ?verify=... */
  activate(): void {
    this.router.navigate(['/login'], { queryParams: { verify: this.verifyToken } });
  }
}
