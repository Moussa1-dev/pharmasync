import { Component } from '@angular/core';
import { Router, RouterOutlet, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ChatbotComponent } from './chatbot/chatbot.component';
import { NotificationService, AppNotification } from './notification.service';
import { OfflineCacheService } from './offline-cache.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule, ChatbotComponent, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  isDarkMode = false;
  sidebarOpen = false;
  quickSearch = '';
  pageTitle = 'Accueil';
  notifOpen = false;
  notifications: AppNotification[] = [];
  unreadCount = 0;
  isOffline = false;

  private readonly pageTitles: Record<string, string> = {
    '/home': 'Accueil',
    '/search': 'Recherche',
    '/login': 'Connexion',
    '/patient': 'Espace patient',
    '/dashboard': 'Tableau de bord',
    '/stats': 'Statistiques',
    '/orders': 'Commandes fournisseurs',
    '/notifications': 'Notifications',
    '/admin': 'Administration',
    '/pos': 'Point de vente',
    '/gardes': 'Planning des gardes'
  };

  constructor(
    public authService: AuthService,
    private router: Router,
    public notifService: NotificationService,
    private offlineCache: OfflineCacheService
  ) {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDarkMode = true;
      document.body.setAttribute('data-theme', 'dark');
    }

    this.isOffline = !this.offlineCache.isOnline;
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => { this.isOffline = false; });
      window.addEventListener('offline', () => { this.isOffline = true; });
    }

    this.notifService.items$.subscribe(list => this.notifications = list);
    this.notifService.unread$.subscribe(n => this.unreadCount = n);

    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        const loader = document.getElementById('app-loader');
        if (loader) {
          loader.style.opacity = '0';
          loader.style.visibility = 'hidden';
          setTimeout(() => loader.remove(), 600);
        }
      });
    }

    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      const url = this.router.url.split('?')[0];
      const params = new URLSearchParams(this.router.url.split('?')[1] || '');
      const tab = params.get('tab');
      if (url === '/dashboard' && tab) {
        const tabLabels: Record<string, string> = {
          stocks: 'Stocks',
          reservations: 'Réservations',
          expiring: 'Péremptions',
          suppliers: 'Fournisseurs',
          available: 'Médicaments disponibles',
          sales: 'Ventes',
          movements: 'Mouvements'
        };
        this.pageTitle = tabLabels[tab] || 'Tableau de bord';
      } else {
        this.pageTitle = this.pageTitles[url] || 'PharmaSync';
      }
      this.sidebarOpen = false;
      this.notifOpen = false;
    });
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.body.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  toggleNotif(): void {
    this.notifOpen = !this.notifOpen;
    if (this.notifOpen) {
      this.notifService.refresh();
    }
  }

  openNotif(n: AppNotification): void {
    this.notifService.markRead(n.id);
    this.notifOpen = false;
    if (n.link) {
      this.router.navigateByUrl(n.link);
    }
  }

  markAllRead(): void {
    this.notifService.markAllRead();
  }

  onQuickSearch(): void {
    const query = this.quickSearch.trim();
    this.router.navigate(['/search'], { queryParams: query ? { query } : {} });
    this.quickSearch = '';
  }

  getAvatarClass(): string {
    const role = this.authService.getCurrentRole();
    if (role === 'admin') return 'avatar-admin';
    if (role === 'pharmacist') return 'avatar-pharmacist';
    return 'avatar-patient';
  }

  onPharmacyChange(id: number): void {
    this.authService.setActivePharmacyId(Number(id));
    this.notifService.refresh();
  }
}
