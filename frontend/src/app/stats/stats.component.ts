import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, Subscription } from 'rxjs';
import Chart from 'chart.js/auto';
import { ApiService } from '../api.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit, OnDestroy {
  pharmacies: any[] = [];
  stocks: any[] = [];
  salesHistory: any[] = [];
  topMedicines: any[] = [];
  predictions: any[] = [];
  totalStock = 0;
  totalRevenue = 0;
  lowStockCount = 0;
  onCallCount = 0;
  stockHealthRate = 0;
  
  chart: Chart | null = null;
  doughnutChart: Chart | null = null;
  trendChart: Chart | null = null;

  private pharmacySub?: Subscription;

  constructor(private apiService: ApiService, public auth: AuthService) {}

  ngOnInit(): void {
    // Recharge les statistiques à chaque changement de "Pharmacie active"
    this.pharmacySub = this.auth.activePharmacyId$.subscribe(() => this.load());
  }

  ngOnDestroy(): void {
    this.pharmacySub?.unsubscribe();
  }

  private load(): void {
    const pharmacyId = this.auth.getActivePharmacyId();
    forkJoin({
      pharmacies: this.apiService.getAllPharmacies(),
      stocks: this.apiService.getPharmacyStocks(pharmacyId),
      sales: this.apiService.getPharmacySales(pharmacyId)
    }).subscribe({
      next: ({ pharmacies, stocks, sales }) => {
        this.pharmacies = pharmacies;
        this.stocks = stocks;
        this.salesHistory = sales;
        this.computeStats();
        setTimeout(() => this.initCharts(), 100);
      },
      error: (err) => console.error('Stats load failed', err)
    });
  }

  private computeStats(): void {
    this.totalStock = this.stocks.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
    this.lowStockCount = this.stocks.filter(item => (item.quantity ?? 0) <= 10).length;
    this.onCallCount = this.pharmacies.filter(pharmacy => pharmacy.isOnCall).length;
    this.totalRevenue = this.salesHistory.reduce((sum, item) => sum + (item.totalPrice ?? 0), 0);

    this.topMedicines = this.stocks
      .map(item => ({
        name: item.medication?.name ?? 'Produit',
        quantity: item.quantity ?? 0,
        price: item.medication?.indicativePrice ?? 0
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const healthy = this.stocks.filter(item => (item.quantity ?? 0) > 10).length;
    this.stockHealthRate = this.stocks.length ? Math.round((healthy / this.stocks.length) * 100) : 0;

    // Advanced feature: Stock Rupture Prediction
    const now = new Date().getTime();
    this.predictions = this.stocks.map(stock => {
      const medId = stock.medication?.id;
      const salesForMed = this.salesHistory.filter(s => s.medication?.id === medId);
      let totalSold = 0;
      let oldestSale = now;
      
      salesForMed.forEach(s => {
        totalSold += s.quantity || 0;
        const sTime = new Date(s.saleDate).getTime();
        if (sTime < oldestSale) oldestSale = sTime;
      });

      let daysSpan = (now - oldestSale) / (1000 * 3600 * 24);
      if (daysSpan < 1) daysSpan = 1; // Default to 1 day minimum to avoid division by zero
      
      // Calculate daily velocity
      let velocity = totalSold / daysSpan;
      
      // If no sales, assume a very low base velocity so it doesn't say "Infinity"
      if (velocity === 0) velocity = 0.1;
      
      const daysRemaining = Math.max(0, Math.round(stock.quantity / velocity));
      
      return {
        name: stock.medication?.name,
        quantity: stock.quantity,
        velocity: velocity.toFixed(1),
        daysRemaining,
        status: daysRemaining < 7 ? 'Critique' : (daysRemaining < 30 ? 'Attention' : 'Normal')
      };
    }).sort((a, b) => a.daysRemaining - b.daysRemaining).slice(0, 8);
  }

  private initCharts(): void {
    const ctx = document.getElementById('stockChart') as HTMLCanvasElement | null;
    const doughnutCtx = document.getElementById('statusChart') as HTMLCanvasElement | null;
    const trendCtx = document.getElementById('trendChart') as HTMLCanvasElement | null;

    if (ctx) {
      if (this.chart) this.chart.destroy();
      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.topMedicines.map(item => item.name),
          datasets: [{
            label: 'Quantité en stock',
            data: this.topMedicines.map(item => item.quantity),
            backgroundColor: ['#14b8a6', '#3b82f6', '#f59e0b', '#f97316', '#10b981'],
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      });
    }

    if (doughnutCtx) {
      if (this.doughnutChart) this.doughnutChart.destroy();
      this.doughnutChart = new Chart(doughnutCtx, {
        type: 'doughnut',
        data: {
          labels: ['En stock', 'Faible stock', 'Rupture'],
          datasets: [{
            data: [
              this.stocks.filter(item => (item.quantity ?? 0) > 10).length,
              this.stocks.filter(item => (item.quantity ?? 0) > 0 && (item.quantity ?? 0) <= 10).length,
              this.stocks.filter(item => (item.quantity ?? 0) === 0).length
            ],
            backgroundColor: ['#14b8a6', '#f59e0b', '#ef4444']
          }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
      });
    }

    // Revenue Trend Chart
    if (trendCtx) {
      if (this.trendChart) this.trendChart.destroy();
      
      // Group sales by day (last 7 days)
      const last7Days = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
      });
      
      const salesByDay = last7Days.map(date => {
        return this.salesHistory
          .filter(s => s.saleDate && s.saleDate.startsWith(date))
          .reduce((sum, s) => sum + (s.totalPrice || 0), 0);
      });

      this.trendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
          labels: last7Days.map(d => {
            const parts = d.split('-');
            return `${parts[2]}/${parts[1]}`;
          }),
          datasets: [{
            label: 'Chiffre d\'affaires (FCFA)',
            data: salesByDay,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
  }

  exportCSV(): void {
    const csvRows = [];
    csvRows.push(['Nom Medicament', 'Quantite en Stock', 'Prix Unitaire (FCFA)', 'Seuil Critique']);
    
    this.stocks.forEach(item => {
      const name = item.medication?.name ?? 'Inconnu';
      const qty = item.quantity ?? 0;
      const price = item.medication?.indicativePrice ?? 0;
      const status = qty <= 10 ? 'Critique' : 'Normal';
      csvRows.push([`"${name}"`, qty, price, `"${status}"`]);
    });

    const csvContent = csvRows.map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `statistiques_stock_${new Date().toISOString().split('T')[0]}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
