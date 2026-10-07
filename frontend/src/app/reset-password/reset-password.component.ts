import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-box">
        <h2 class="auth-title">Nouveau mot de passe</h2>
        
        <div *ngIf="!token" class="alert alert-danger">
          Jeton de réinitialisation manquant ou invalide.
        </div>

        <div *ngIf="successMessage" class="alert alert-success">{{ successMessage }}</div>
        <div *ngIf="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>

        <form (ngSubmit)="onSubmit()" #resetForm="ngForm" *ngIf="token && !successMessage">
          <div class="form-group">
            <label>Nouveau mot de passe</label>
            <input type="password" class="form-control" name="password" [(ngModel)]="password" required minlength="6">
          </div>
          
          <button type="submit" class="btn btn-primary btn-block" [disabled]="!resetForm.form.valid || loading">
            <span *ngIf="!loading">Enregistrer</span>
            <span *ngIf="loading">Enregistrement...</span>
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
export class ResetPasswordComponent implements OnInit {
  token = '';
  password = '';
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
    });
  }

  onSubmit() {
    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';
    
    this.api.request('POST', 'auth/reset-password', { token: this.token, password: this.password }).subscribe({
      next: (res: any) => {
        this.successMessage = res.message || 'Mot de passe réinitialisé avec succès.';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || err.error || 'Jeton invalide ou expiré.';
        this.loading = false;
      }
    });
  }
}
