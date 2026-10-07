import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  error = '';
  showPassword = false;
  loading = false;
  returnUrl: string | null = null;

  demoAccounts = [
    { label: 'Pharmacien', email: 'pharmacien@pharmasync.com', password: 'pharma123', icon: 'fa-user-doctor', hint: 'Accès stocks, ventes, réservations' },
    { label: 'Admin', email: 'admin@pharmasync.com', password: 'admin123', icon: 'fa-user-shield', hint: 'Accès complet' }
  ];

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || null;

    const verifyToken = this.route.snapshot.queryParamMap.get('verify');
    if (verifyToken) {
      this.authService.verifyEmail(verifyToken).subscribe({
        next: (res) => {
          Swal.fire('Succès', res.message || 'Compte vérifié avec succès. Vous pouvez vous connecter.', 'success');
        },
        error: (err) => {
          Swal.fire('Erreur', err.error?.message || 'Jeton de vérification invalide.', 'error');
        }
      });
    }
  }

  onLogin(): void {
    if (!this.username.trim() || !this.password) {
      this.error = 'Veuillez remplir tous les champs.';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.error = '';
        this.authService.redirectAfterLogin(this.returnUrl);
      },
      error: () => {
        this.loading = false;
        this.error = 'Identifiant ou mot de passe incorrect.';
      }
    });
  }

  fillDemo(account: { email: string; password: string }): void {
    this.username = account.email;
    this.password = account.password;
    this.error = '';
  }

  continueAsGuest(): void {
    this.authService.connectAsGuest();
    this.authService.redirectAfterLogin('/search');
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}
