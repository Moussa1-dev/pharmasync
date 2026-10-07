import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-box">
        <h2 class="auth-title">Mot de passe oublié</h2>
        <p class="auth-subtitle">Entrez votre adresse email pour recevoir un lien de réinitialisation.</p>
        
        <div *ngIf="successMessage" class="alert alert-success">{{ successMessage }}</div>
        <!-- Démo : pas de vrai e-mail, le lien s'affiche ici -->
        <a *ngIf="resetToken" class="btn btn-accent btn-block" routerLink="/reset-password" [queryParams]="{ token: resetToken }">
          Choisir un nouveau mot de passe (démonstration)
        </a>
        <div *ngIf="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>

        <form (ngSubmit)="onSubmit()" #forgotForm="ngForm">
          <div class="form-group">
            <label>Adresse e-mail</label>
            <input type="email" class="form-control" name="email" [(ngModel)]="email" required>
          </div>
          
          <button type="submit" class="btn btn-primary btn-block" [disabled]="!forgotForm.form.valid || loading">
            <span *ngIf="!loading">Envoyer le lien</span>
            <span *ngIf="loading">Envoi en cours...</span>
          </button>
        </form>
        
        <p class="auth-footer text-center mt-3">
          <a routerLink="/login">Retour à la connexion</a>
        </p>
      </div>
    </div>
  `,
  styleUrls: ['../login/login.component.css']
})
export class ForgotPasswordComponent {
  email = '';
  loading = false;
  successMessage = '';
  errorMessage = '';
  resetToken: string | null = null;

  constructor(private api: ApiService) {}

  onSubmit() {
    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';
    
    this.api.request('POST', 'auth/forgot-password', { email: this.email }).subscribe({
      next: (res: any) => {
        this.successMessage = res.message || 'Lien envoyé avec succès.';
        this.resetToken = res.resetToken || null;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || err.error || 'Erreur lors de la demande.';
        this.loading = false;
      }
    });
  }
}
