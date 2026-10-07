import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../api.service';
import { AuthService } from '../auth.service';
import { ExportService } from '../shared/export.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { forkJoin, Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  stocks: any[] = [];
  filteredStocks: any[] = [];
  expiringStocks: any[] = [];
  reservations: any[] = [];
  allMedications: any[] = [];
  availableMedications: any[] = [];
  suppliers: any[] = [];
  pharmacyId: number = 1;
  salesHistory: any[] = [];
  filteredSalesHistory: any[] = [];
  salesStartDate: string = '';
  salesEndDate: string = '';
  stockMovements: any[] = [];

  activeTab: 'stocks' | 'reservations' | 'expiring' | 'suppliers' | 'available' | 'sales' | 'movements' = 'stocks';
  inventoryView: 'all' | 'stock' | 'rupture' | 'alerte' = 'all';
  inventorySearch: string = '';
  criticalItems: any[] = [];
  recentActivities: Array<{ title: string; detail: string; type: 'stock' | 'reservation' | 'alert'; time: string }> = [];
  showUpdateModal: boolean = false;
  showAddModal: boolean = false;
  selectedStock: any = null;
  newQuantity: number = 0;

  newStockData = {
    medicationId: '',
    quantity: 1,
    expirationDate: '',
    lotNumber: '',
    serialNumber: ''
  };

  recallLot = '';
  recallReason = '';
  recalls: any[] = [];
  lotTraceQuery = '';
  lotTraceResult: any = null;

  chatReservation: any = null;
  chatMessages: any[] = [];
  chatDraft = '';
  private chatPoll?: any;
  private pharmacySub?: Subscription;

  newSupplier = {
    name: '',
    contact: '',
    email: '',
    specialty: ''
  };

  totalStock: number = 0;
  ruptures: number = 0;
  alertes: number = 0;
  totalRevenue: number = 0;
  pendingReservations: number = 0;

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private exportService: ExportService,
    private auth: AuthService
  ) {}

  /**
   * Page ouverte depuis le menu :
   *  - 'stocks'       -> uniquement les stocks (inventaire, disponibles, péremptions, mouvements)
   *  - 'reservations' -> uniquement les réservations
   *  - null           -> tableau de bord complet (résumé + tous les onglets)
   */
  focus: 'stocks' | 'reservations' | null = null;
  private readonly stockTabs = ['stocks', 'available', 'expiring', 'movements'];

  private applyFocus(tab: string | null): void {
    if (tab === 'reservations') {
      this.focus = 'reservations';
    } else if (tab && this.stockTabs.includes(tab)) {
      this.focus = 'stocks';
    } else {
      this.focus = null;
    }
  }

  get pageTitle(): string {
    if (this.focus === 'stocks') return 'Stocks';
    if (this.focus === 'reservations') return 'Réservations';
    return 'Tableau de Bord';
  }

  get pageSubtitle(): string {
    if (this.focus === 'stocks') return 'Inventaire, médicaments disponibles, péremptions et mouvements';
    if (this.focus === 'reservations') return 'Réservations des patients à confirmer, servir ou annuler';
    return 'Vue d\'ensemble : indicateurs, alertes et activité';
  }

  /** Nom de la pharmacie active (affiché dans le titre) */
  get activePharmacyName(): string {
    return this.auth.getActivePharmacyName() || 'Ma pharmacie';
  }

  ngOnInit(): void {
    this.pharmacyId = this.auth.getActivePharmacyId();
    this.pharmacySub = this.auth.activePharmacyId$.subscribe(id => {
      if (id != null && id !== this.pharmacyId) {
        this.pharmacyId = id;
        this.bootstrapData();
      }
    });

    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab && this.isValidTab(tab)) {
      this.activeTab = tab as typeof this.activeTab;
    }

    this.route.queryParamMap.subscribe(params => {
      const nextTab = params.get('tab');
      this.applyFocus(nextTab);
      if (nextTab && this.isValidTab(nextTab)) {
        this.activeTab = nextTab as typeof this.activeTab;
        if (nextTab === 'movements') {
          this.loadMovements();
        }
      }
    });

    this.bootstrapData();
  }

  ngOnDestroy(): void {
    this.pharmacySub?.unsubscribe();
    if (this.chatPoll) clearInterval(this.chatPoll);
  }

  reloadAll(): void {
    this.bootstrapData();
  }

  private bootstrapData(): void {
    forkJoin({
      stocks: this.apiService.getPharmacyStocks(this.pharmacyId),
      expiring: this.apiService.getExpiringStocks(this.pharmacyId),
      reservations: this.apiService.getPharmacyReservations(this.pharmacyId),
      medications: this.apiService.getAllMedications(),
      suppliers: this.apiService.getSuppliers(),
      summary: this.apiService.getPharmacySummary(this.pharmacyId),
      sales: this.apiService.getPharmacySales(this.pharmacyId)
    }).subscribe({
      next: ({ stocks, expiring, reservations, medications, suppliers, summary, sales }) => {
        this.stocks = stocks || [];
        this.expiringStocks = expiring || [];
        this.reservations = (reservations || []).sort((a: any, b: any) => b.id - a.id);
        this.allMedications = medications || [];
        this.suppliers = suppliers || [];
        this.totalStock = summary?.totalStock ?? 0;
        this.ruptures = summary?.ruptures ?? 0;
        this.alertes = summary?.alertes ?? 0;
        this.totalRevenue = summary?.totalRevenue ?? 0;
        this.pendingReservations = summary?.pendingReservations ?? 0;
        this.salesHistory = (sales || []).sort((a: any, b: any) => b.id - a.id);
        this.filteredSalesHistory = [...this.salesHistory];

        try {
          this.availableMedications = this.stocks
            .filter((stock: any) => stock.quantity > 0)
            .map((stock: any) => ({
              id: stock.medication?.id,
              name: stock.medication?.name,
              description: stock.medication?.description,
              indicativePrice: stock.medication?.indicativePrice,
              quantity: stock.quantity,
              expirationDate: stock.expirationDate,
              lotNumber: stock.lotNumber
            }));
          this.applyInventoryFilter();
          this.calculateStats();
          this.calculateRevenue();
          this.buildRecentActivities();
        } catch (e) {
          console.error('Error processing dashboard data:', e);
        }

        this.loadRecalls();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Dashboard data loading failed', err);
        Swal.fire('Erreur', 'Impossible de charger les données du tableau de bord. Vérifiez la connexion au serveur.', 'error');
      }
    });
  }

  loadSalesHistory(): void {
    this.apiService.getPharmacySales(this.pharmacyId).subscribe({
      next: (data) => {
        this.salesHistory = data.sort((a: any, b: any) => b.id - a.id);
        this.filteredSalesHistory = [...this.salesHistory];
        this.applySalesFilter();
      },
      error: (err) => console.error(err)
    });
  }

  trackByStock(index: number, stock: any): number {
    return stock?.id ?? index;
  }

  trackByAvailableMedication(index: number, item: any): number {
    return item?.id ?? index;
  }

  trackByReservation(index: number, reservation: any): number {
    return reservation?.id ?? index;
  }

  trackBySupplier(index: number, supplier: any): number {
    return supplier?.id ?? index;
  }

  loadAllMedications(): void {
    this.apiService.getAllMedications().subscribe({
      next: (data) => this.allMedications = data,
      error: (err) => console.error(err)
    });
  }

  loadSuppliers(): void {
    this.apiService.getSuppliers().subscribe({
      next: (data) => this.suppliers = data,
      error: (err) => console.error(err)
    });
  }

  loadExpiringStocks(): void {
    this.apiService.getExpiringStocks(this.pharmacyId).subscribe({
      next: (data) => {
        this.expiringStocks = data;
      },
      error: (err) => console.error(err)
    });
  }

  loadStocks(): void {
    this.apiService.getPharmacyStocks(this.pharmacyId).subscribe({
      next: (data) => {
        this.stocks = data;
        this.availableMedications = data
          .filter((stock: any) => stock.quantity > 0)
          .map((stock: any) => ({
            id: stock.medication.id,
            name: stock.medication.name,
            description: stock.medication.description,
            indicativePrice: stock.medication.indicativePrice,
            quantity: stock.quantity,
            expirationDate: stock.expirationDate
          }));
        this.applyInventoryFilter();
        this.calculateStats();
      },
      error: (err) => console.error(err)
    });
  }

  setInventoryFilter(view: 'all' | 'stock' | 'rupture' | 'alerte'): void {
    this.inventoryView = view;
    this.applyInventoryFilter();
  }

  applyInventoryFilter(): void {
    let filtered = [...this.stocks];

    if (this.inventoryView === 'stock') {
      filtered = filtered.filter(stock => stock.quantity > 0);
    } else if (this.inventoryView === 'rupture') {
      filtered = filtered.filter(stock => stock.quantity === 0);
    } else if (this.inventoryView === 'alerte') {
      filtered = filtered.filter(stock => stock.quantity > 0 && stock.quantity <= 10);
    }

    if (this.inventorySearch.trim()) {
      const term = this.inventorySearch.trim().toLowerCase();
      filtered = filtered.filter(stock => stock.medication.name.toLowerCase().includes(term));
    }

    this.filteredStocks = filtered;
  }

  loadReservations(): void {
    this.apiService.getPharmacyReservations(this.pharmacyId).subscribe({
      next: (data) => {
        this.reservations = data.sort((a: any, b: any) => b.id - a.id);
        this.calculateRevenue();
      },
      error: (err) => console.error(err)
    });
  }

  loadSummary(): void {
    this.apiService.getPharmacySummary(this.pharmacyId).subscribe({
      next: (data) => {
        this.totalStock = data.totalStock ?? 0;
        this.ruptures = data.ruptures ?? 0;
        this.alertes = data.alertes ?? 0;
        this.totalRevenue = data.totalRevenue ?? 0;
        this.pendingReservations = data.pendingReservations ?? 0;
      },
      error: (err) => console.error(err)
    });
  }

  calculateRevenue(): void {
    if (this.reservations && this.reservations.length > 0) {
      this.totalRevenue = this.reservations
        .filter(r => r.status === 'COMPLETED')
        .reduce((sum, r) => sum + (r.quantity * r.stock.medication.indicativePrice), 0);
    }
  }

  updateReservationStatus(reservation: any, newStatus: string): void {
    this.apiService.updateReservationStatus(reservation.id, newStatus).subscribe({
      next: () => {
        reservation.status = newStatus;
        this.calculateRevenue();
        if (newStatus === 'CANCELLED' || newStatus === 'COMPLETED') {
          this.loadStocks();
        }
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Statut mis à jour',
          showConfirmButton: false,
          timer: 3000
        });
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Erreur', 'Impossible de mettre à jour le statut.', 'error');
      }
    });
  }

  openUpdateModal(stock: any): void {
    this.selectedStock = stock;
    this.newQuantity = stock.quantity;
    this.showUpdateModal = true;
  }

  closeUpdateModal(): void {
    this.showUpdateModal = false;
    this.selectedStock = null;
  }

  submitUpdate(): void {
    if (this.selectedStock && this.newQuantity >= 0) {
      this.apiService.updateStock(this.selectedStock.id, this.newQuantity).subscribe({
        next: () => {
          this.loadStocks();
          this.closeUpdateModal();
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Stock mis à jour avec succès',
            showConfirmButton: false,
            timer: 3000
          });
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Erreur', 'Impossible de mettre à jour le stock.', 'error');
        }
      });
    }
  }

  openAddModal(): void {
    this.newStockData = { medicationId: '', quantity: 1, expirationDate: '', lotNumber: '', serialNumber: '' };
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  submitAddStock(): void {
    if (this.newStockData.medicationId && this.newStockData.quantity > 0 && this.newStockData.expirationDate) {
      const payload = {
        ...this.newStockData,
        medicationId: Number(this.newStockData.medicationId)
      };
      this.apiService.addStock(this.pharmacyId, payload).subscribe({
        next: () => {
          this.loadStocks();
          this.closeAddModal();
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Médicament ajouté au stock',
            showConfirmButton: false,
            timer: 3000
          });
        },
        error: (err) => {
          console.error(err);
          let msg = 'Données invalides ou erreur serveur.';
          if (err.error && typeof err.error === 'string') {
            if (err.error.includes('already exists')) {
              msg = "Ce médicament est déjà en stock ! Pour l'ajouter à nouveau, veuillez spécifier un N° de lot différent, ou utilisez le bouton 'Mettre à jour' sur le stock existant.";
            } else {
              msg = err.error;
            }
          }
          Swal.fire('Erreur', msg, 'error');
        }
      });
    } else {
      Swal.fire('Champs manquants', 'Veuillez remplir tous les champs obligatoires (Médicament, Quantité, Date de péremption).', 'warning');
    }
  }

  submitSupplier(): void {
    if (!this.newSupplier.name || !this.newSupplier.contact) {
      return;
    }

    this.apiService.createSupplier(this.newSupplier).subscribe({
      next: () => {
        this.newSupplier = { name: '', contact: '', email: '', specialty: '' };
        this.loadSuppliers();
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Fournisseur ajouté avec succès',
          showConfirmButton: false,
          timer: 3000
        });
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Erreur', 'Impossible d\'ajouter le fournisseur.', 'error');
      }
    });
  }

  exportCSV(): void {
    const header = ['Médicament', 'Prix', 'Quantité', 'Date Péremption'];
    const csvData = this.stocks.map(s => [
      s.medication.name,
      s.medication.indicativePrice,
      s.quantity,
      s.expirationDate
    ].join(','));
    
    const csvContent = [header.join(','), ...csvData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'inventaire_pharmacie.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  importCSV(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      this.apiService.importStocks(this.pharmacyId, formData).subscribe({
        next: (res: any) => {
          Swal.fire('Succès', 'Stocks importés avec succès.', 'success');
          this.loadStocks();
        },
        error: (err: any) => {
          Swal.fire('Erreur', 'Erreur lors de l\'importation.', 'error');
        }
      });
    }
    // reset input
    event.target.value = '';
  }

  loadMovements(): void {
    this.activeTab = 'movements';
    this.apiService.getStockMovements(this.pharmacyId).subscribe({
      next: (data) => {
        this.stockMovements = data;
      },
      error: (err) => console.error(err)
    });
  }

  generateReceipt(reservation: any): void {
    Promise.all([
      import('jspdf'),
      import('qrcode')
    ]).then(([{ jsPDF }, QRCode]) => {
      const doc = new jsPDF();
      
      // En-tête
      doc.setFontSize(22);
      doc.setTextColor(16, 185, 129); // var(--primary)
      doc.text('PHARMASYNC', 105, 20, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setTextColor(100);
      doc.text('Reçu de Réservation', 105, 30, { align: 'center' });
      
      doc.setLineWidth(0.5);
      doc.line(20, 35, 190, 35);
      
      // Informations Patient
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`Patient : ${reservation.patientName}`, 20, 50);
      doc.text(`Contact : ${reservation.patientContact}`, 20, 60);
      doc.text(`Date : ${new Date(reservation.createdAt).toLocaleDateString()}`, 20, 70);
      doc.text(`Réservation N° : ${reservation.id}`, 140, 50);
      doc.text(`Statut : ${reservation.status}`, 140, 60);

      // Détails Médicament
      doc.setFillColor(240, 240, 240);
      doc.rect(20, 80, 170, 10, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Description', 25, 87);
      doc.text('Qté', 130, 87);
      doc.text('Prix Unit.', 150, 87);
      doc.text('Total', 175, 87);
      
      doc.setFont('helvetica', 'normal');
      doc.text(reservation.stock.medication.name, 25, 100);
      doc.text(reservation.quantity.toString(), 130, 100);
      doc.text(`${reservation.stock.medication.indicativePrice.toFixed(2)} FCFA`, 150, 100);
      const total = reservation.quantity * reservation.stock.medication.indicativePrice;
      doc.text(`${total.toFixed(2)} FCFA`, 175, 100);
      
      doc.setLineWidth(0.2);
      doc.line(20, 105, 190, 105);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Total payé :', 140, 120);
      doc.setTextColor(16, 185, 129);
      doc.text(`${total.toFixed(2)} FCFA`, 175, 120);

      // QR Code pour vérification de l'authenticité
      const qrData = `Réservation N°${reservation.id} - ${reservation.patientName} - ${reservation.stock.medication.name} - Validé par PharmaSync`;
      QRCode.toDataURL(qrData, { margin: 1, width: 40 }, (err, url) => {
        if (!err) {
          doc.addImage(url, 'PNG', 20, 115, 30, 30);
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text('Scan pour vérifier', 22, 148);
        }

        // Footer
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.setFont('helvetica', 'italic');
        doc.text('Merci de votre confiance. Bonne guérison !', 105, 160, { align: 'center' });
        
        doc.save(`Recu_Pharmacie_${reservation.id}.pdf`);
      });
    });
  }

  applySalesFilter(): void {
    if (!this.salesStartDate && !this.salesEndDate) {
      this.filteredSalesHistory = [...this.salesHistory];
      return;
    }

    const start = this.salesStartDate ? new Date(this.salesStartDate).getTime() : 0;
    const end = this.salesEndDate ? new Date(this.salesEndDate).setHours(23, 59, 59, 999) : Infinity;

    this.filteredSalesHistory = this.salesHistory.filter(sale => {
      const saleDate = new Date(sale.saleDate).getTime();
      return saleDate >= start && saleDate <= end;
    });
  }

  clearSalesFilter(): void {
    this.salesStartDate = '';
    this.salesEndDate = '';
    this.filteredSalesHistory = [...this.salesHistory];
  }

  getSalesTotal(): number {
    return this.filteredSalesHistory.reduce((sum, sale) => sum + sale.totalPrice, 0);
  }

  exportSalesCSV(): void {
    const header = ['ID', 'Client', 'Médicament', 'Quantité', 'Total (FCFA)', 'Date'];
    const rows = this.filteredSalesHistory.map(sale => [
      `#${sale.id}`,
      sale.customerName || 'Standard',
      sale.medication.name,
      sale.quantity,
      sale.totalPrice,
      new Date(sale.saleDate).toLocaleString('fr-FR')
    ]);
    this.exportService.downloadCsv('historique_ventes.csv', header, rows);
  }

  exportSalesExcel(): void {
    const header = ['ID', 'Client', 'Médicament', 'Quantité', 'Total (FCFA)', 'Date'];
    const rows = this.filteredSalesHistory.map(sale => [
      sale.id,
      sale.customerName || 'Standard',
      sale.medication.name,
      sale.quantity,
      sale.totalPrice,
      new Date(sale.saleDate).toLocaleString('fr-FR')
    ]);
    this.exportService.downloadExcel('historique_ventes.xlsx', 'Ventes', header, rows);
  }

  exportSalesPdf(): void {
    const header = ['ID', 'Client', 'Médicament', 'Qté', 'Total', 'Date'];
    const rows = this.filteredSalesHistory.map(sale => [
      String(sale.id),
      sale.customerName || 'Standard',
      sale.medication.name,
      sale.quantity,
      `${sale.totalPrice} FCFA`,
      new Date(sale.saleDate).toLocaleDateString('fr-FR')
    ]);
    this.exportService.downloadPdf(
      'historique_ventes.pdf',
      'Historique des ventes',
      header,
      rows,
      `Total période : ${this.getSalesTotal().toFixed(2)} FCFA`
    );
  }

  private ruptureRows(): { headers: string[]; rows: (string | number)[][] } {
    const ruptures = this.stocks.filter(s => s.quantity <= 0);
    return {
      headers: ['Médicament', 'Prix', 'Quantité', 'Péremption'],
      rows: ruptures.map(s => [
        s.medication.name,
        s.medication.indicativePrice ?? 0,
        s.quantity,
        s.expirationDate || ''
      ])
    };
  }

  exportRupturesExcel(): void {
    const { headers, rows } = this.ruptureRows();
    if (!rows.length) {
      Swal.fire('Info', 'Aucune rupture de stock à exporter.', 'info');
      return;
    }
    this.exportService.downloadExcel('ruptures_stock.xlsx', 'Ruptures', headers, rows);
  }

  exportRupturesPdf(): void {
    const { headers, rows } = this.ruptureRows();
    if (!rows.length) {
      Swal.fire('Info', 'Aucune rupture de stock à exporter.', 'info');
      return;
    }
    this.exportService.downloadPdf('ruptures_stock.pdf', 'Ruptures de stock', headers, rows);
  }

  paymentLabel(res: any): string {
    if (res.paymentStatus === 'PAID') return 'Payé';
    if (res.paymentStatus === 'PENDING') return 'Paiement en cours';
    if (res.paymentStatus === 'FAILED') return 'Échec';
    if (res.paymentMethod === 'ORANGE_MONEY' || res.paymentMethod === 'AIRTEL_MONEY') return 'À payer';
    return 'Espèces';
  }

  loadRecalls(): void {
    this.apiService.getRecalls(this.pharmacyId).subscribe({
      next: (data) => this.recalls = data || [],
      error: () => this.recalls = []
    });
  }

  searchLotTrace(): void {
    const lot = (this.lotTraceQuery || '').trim();
    if (!lot) return;
    this.apiService.traceByLot(lot).subscribe({
      next: (data) => this.lotTraceResult = data,
      error: () => Swal.fire('Introuvable', 'Aucun résultat pour ce lot.', 'info')
    });
  }

  launchRecall(): void {
    if (!this.recallLot.trim()) {
      Swal.fire('Lot requis', 'Indiquez le numéro de lot à rappeler.', 'warning');
      return;
    }
    this.apiService.createRecall({
      lotNumber: this.recallLot.trim(),
      reason: this.recallReason || 'Rappel produit',
      pharmacyId: this.pharmacyId,
      createdBy: this.auth.getEmail() || 'pharmacien'
    }).subscribe({
      next: () => {
        Swal.fire('Rappel créé', 'Les stocks concernés ont été notifiés.', 'success');
        this.recallLot = '';
        this.recallReason = '';
        this.loadRecalls();
      },
      error: () => Swal.fire('Erreur', 'Impossible de créer le rappel.', 'error')
    });
  }

  closeRecall(id: number): void {
    this.apiService.closeRecall(id).subscribe({
      next: () => this.loadRecalls(),
      error: () => Swal.fire('Erreur', 'Fermeture impossible.', 'error')
    });
  }

  openChat(res: any): void {
    this.chatReservation = res;
    this.chatDraft = '';
    this.refreshChat();
    if (this.chatPoll) clearInterval(this.chatPoll);
    this.chatPoll = setInterval(() => this.refreshChat(), 4000);
  }

  closeChat(): void {
    this.chatReservation = null;
    this.chatMessages = [];
    if (this.chatPoll) {
      clearInterval(this.chatPoll);
      this.chatPoll = undefined;
    }
  }

  refreshChat(): void {
    if (!this.chatReservation) return;
    this.apiService.getReservationChat(this.chatReservation.id).subscribe({
      next: (msgs) => this.chatMessages = msgs || [],
      error: () => undefined
    });
  }

  sendChat(): void {
    if (!this.chatReservation || !this.chatDraft.trim()) return;
    this.apiService.sendReservationChat(this.chatReservation.id, {
      content: this.chatDraft.trim(),
      senderRole: 'PHARMACIEN',
      senderName: this.auth.getActivePharmacyName()
    }).subscribe({
      next: () => {
        this.chatDraft = '';
        this.refreshChat();
      },
      error: () => Swal.fire('Erreur', 'Envoi impossible.', 'error')
    });
  }

  clearInventorySearch(): void {
    this.inventorySearch = '';
    this.applyInventoryFilter();
  }

  private isValidTab(tab: string): boolean {
    return ['stocks', 'reservations', 'expiring', 'suppliers', 'available', 'sales', 'movements'].includes(tab);
  }

  goToQuickAction(action: 'stock' | 'alert' | 'reservation' | 'faible'): void {
    if (action === 'stock') {
      this.activeTab = 'stocks';
      this.setInventoryFilter('stock');
    } else if (action === 'faible') {
      this.activeTab = 'stocks';
      this.setInventoryFilter('alerte');
    } else if (action === 'alert') {
      this.activeTab = 'expiring';
    } else {
      this.activeTab = 'reservations';
    }

    setTimeout(() => {
      const el = document.querySelector('.stocks-container');
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 100);
  }

  orderFromAlert(item: any): void {
    const qty = Math.max(50, 100 - (item.quantity || 0));
    Swal.fire({
      title: 'Commander maintenant ?',
      html: `<b>${item.medication?.name}</b><br>${qty} unités suggérées (stock actuel : ${item.quantity})`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Créer la commande',
      cancelButtonText: 'Ouvrir le formulaire',
      confirmButtonColor: '#0f766e'
    }).then(result => {
      if (result.isConfirmed) {
        this.apiService.createOrderFromAlert({
          pharmacyId: this.pharmacyId,
          medicationName: item.medication?.name,
          currentQuantity: item.quantity,
          quantity: qty,
          supplierName: 'Fournisseur principal',
          unitPrice: item.medication?.indicativePrice || 250
        }).subscribe({
          next: () => {
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: 'Commande fournisseur créée',
              showConfirmButton: false,
              timer: 2500
            });
            this.router.navigate(['/orders']);
          },
          error: () => Swal.fire('Erreur', 'Impossible de créer la commande.', 'error')
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        this.router.navigate(['/orders'], {
          queryParams: { medication: item.medication?.name, qty }
        });
      }
    });
  }

  buildRecentActivities(): void {
    const recentReservationItems = this.reservations.slice(0, 3).map((res: any) => ({
      title: `Réservation ${res.patientName}`,
      detail: `${res.stock.medication.name} • ${res.quantity} unité(s) • ${res.status === 'PENDING' ? 'en attente' : res.status === 'CONFIRMED' ? 'confirmée' : 'livrée'}`,
      type: 'reservation' as const,
      time: res.createdAt ? new Date(res.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'À l\'instant'
    }));

    const lowStockItems = this.criticalItems.slice(0, 2).map((item: any) => ({
      title: `Stock faible: ${item.medication.name}`,
      detail: `${item.quantity} unités restantes`,
      type: 'alert' as const,
      time: 'À vérifier'
    }));

    const stockUpdates = this.stocks.slice(0, 2).map((item: any) => ({
      title: `Mise à jour: ${item.medication.name}`,
      detail: `${item.quantity} unités en stock`,
      type: 'stock' as const,
      time: item.expirationDate ? new Date(item.expirationDate).toLocaleDateString('fr-FR') : 'Aujourd\'hui'
    }));

    this.recentActivities = [...recentReservationItems, ...lowStockItems, ...stockUpdates]
      .slice(0, 5);
  }

  calculateStats(): void {
    // We rely on the backend summary for totalStock, ruptures, and alertes.
    // We only calculate criticalItems for the UI list.
    if (this.stocks && this.stocks.length > 0) {
      this.criticalItems = this.stocks.filter(s => s.quantity <= 10).sort((a, b) => a.quantity - b.quantity).slice(0, 4);
    }
  }

}

