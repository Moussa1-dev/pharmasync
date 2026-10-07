import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../api.service';
import { AuthService } from '../../auth.service';
import Swal from 'sweetalert2';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pos.component.html',
  styleUrl: './pos.component.css'
})
export class PosComponent implements OnInit, OnDestroy {
  stocks: any[] = [];
  filteredStocks: any[] = [];
  searchQuery: string = '';
  barcodeInput: string = '';
  scannerActive = false;
  private html5QrCode: any = null;

  cart: any[] = [];
  customerName: string = '';

  pharmacyId: number = 1;
  pharmacyName: string = 'Ma Pharmacie';
  private pharmacySub?: any;

  constructor(private apiService: ApiService, private authService: AuthService) {}

  ngOnInit(): void {
    this.pharmacyId = this.authService.getActivePharmacyId();
    this.pharmacyName = this.authService.getActivePharmacyName();
    this.pharmacySub = this.authService.activePharmacyId$.subscribe(id => {
      if (id != null) {
        this.pharmacyId = id;
        this.pharmacyName = this.authService.getActivePharmacyName();
        this.loadStocks();
      }
    });
    this.loadStocks();
  }

  ngOnDestroy(): void {
    this.pharmacySub?.unsubscribe();
    this.stopCameraScanner();
  }

  loadStocks() {
    if (this.pharmacyId) {
      this.apiService.getPharmacyStocks(this.pharmacyId).subscribe(data => {
        this.stocks = data;
        this.filteredStocks = [...this.stocks];
      });
    }
  }

  filterStocks() {
    if (!this.searchQuery) {
      this.filteredStocks = [...this.stocks];
    } else {
      const q = this.searchQuery.toLowerCase();
      this.filteredStocks = this.stocks.filter(s =>
        s.medication.name.toLowerCase().includes(q) ||
        (s.medication.barcode && s.medication.barcode.toLowerCase().includes(q))
      );
    }
  }

  onBarcodeEnter(): void {
    const code = (this.barcodeInput || '').trim();
    if (!code) return;
    this.resolveBarcode(code);
    this.barcodeInput = '';
  }

  resolveBarcode(code: string): void {
    const local = this.stocks.find(s => s.medication?.barcode === code);
    if (local) {
      this.addToCart(local);
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: local.medication.name + ' ajouté', showConfirmButton: false, timer: 1500 });
      return;
    }

    this.apiService.findStockByBarcode(this.pharmacyId, code).subscribe({
      next: (stock) => {
        this.addToCart(stock);
        if (!this.stocks.find(s => s.id === stock.id)) {
          this.stocks.push(stock);
          this.filterStocks();
        }
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: stock.medication.name + ' ajouté', showConfirmButton: false, timer: 1500 });
      },
      error: () => {
        Swal.fire('Introuvable', `Aucun médicament pour le code ${code}`, 'warning');
      }
    });
  }

  async toggleCameraScanner(): Promise<void> {
    if (this.scannerActive) {
      await this.stopCameraScanner();
      return;
    }
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      this.html5QrCode = new Html5Qrcode('pos-qr-reader');
      await this.html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 8, qrbox: { width: 220, height: 120 } },
        (decoded: string) => this.resolveBarcode(decoded.trim()),
        () => {}
      );
      this.scannerActive = true;
    } catch (e) {
      console.error(e);
      Swal.fire('Caméra', 'Impossible d\'accéder à la caméra. Utilisez le champ code-barres (douchette).', 'info');
      this.scannerActive = false;
    }
  }

  async stopCameraScanner(): Promise<void> {
    if (this.html5QrCode) {
      try {
        await this.html5QrCode.stop();
        await this.html5QrCode.clear();
      } catch { /* ignore */ }
      this.html5QrCode = null;
    }
    this.scannerActive = false;
  }

  addToCart(stock: any) {
    if (stock.quantity <= 0) {
      Swal.fire('Erreur', 'Rupture de stock pour ce médicament.', 'error');
      return;
    }

    const existing = this.cart.find(item => item.medication.id === stock.medication.id);
    if (existing) {
      if (existing.cartQuantity < stock.quantity) {
        existing.cartQuantity++;
      } else {
        Swal.fire('Erreur', 'Quantité maximale en stock atteinte.', 'warning');
      }
    } else {
      this.cart.push({
        ...stock,
        cartQuantity: 1
      });
    }
  }

  removeFromCart(item: any) {
    this.cart = this.cart.filter(c => c.medication.id !== item.medication.id);
  }

  increaseQuantity(item: any) {
    const stockItem = this.stocks.find(s => s.medication.id === item.medication.id);
    if (stockItem && item.cartQuantity < stockItem.quantity) {
      item.cartQuantity++;
    }
  }

  decreaseQuantity(item: any) {
    if (item.cartQuantity > 1) {
      item.cartQuantity--;
    } else {
      this.removeFromCart(item);
    }
  }

  getTotal(): number {
    return this.cart.reduce((total, item) => total + ((item.medication.indicativePrice || 0) * item.cartQuantity), 0);
  }

  processSale() {
    if (this.cart.length === 0) {
      Swal.fire('Panier vide', 'Veuillez ajouter des médicaments.', 'warning');
      return;
    }

    if (!this.pharmacyId) return;

    let processedCount = 0;
    const totalItems = this.cart.length;

    Swal.fire({
      title: 'Traitement de la vente...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.cart.forEach(item => {
      const saleData = {
        pharmacyId: this.pharmacyId,
        medicationId: item.medication.id,
        stockId: item.id,
        quantity: item.cartQuantity,
        customerName: this.customerName,
        lotNumber: item.lotNumber
      };

      this.apiService.createSale(saleData).subscribe({
        next: () => {
          processedCount++;
          if (processedCount === totalItems) {
            this.finishSale();
          }
        },
        error: () => {
          Swal.fire('Erreur', 'Une erreur est survenue lors de la vente.', 'error');
        }
      });
    });
  }

  finishSale() {
    this.generateInvoicePDF();

    Swal.fire({
      icon: 'success',
      title: 'Vente réussie',
      text: 'Le stock a été mis à jour et la facture générée.',
      timer: 2000,
      showConfirmButton: false
    }).then(() => {
      this.cart = [];
      this.customerName = '';
      this.loadStocks();
    });
  }

  generateInvoicePDF() {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text('FACTURE', 105, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.text(`Pharmacie : ${this.pharmacyName}`, 14, 40);
    doc.text(`Date : ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 50);

    if (this.customerName) {
      doc.text(`Client : ${this.customerName}`, 14, 60);
    }

    const tableColumn = ["Médicament", "Quantité", "Prix unitaire", "Sous-total"];
    const tableRows: any[] = [];

    this.cart.forEach(item => {
      const price = item.medication.indicativePrice || 0;
      const subtotal = price * item.cartQuantity;
      const row = [
        item.medication.name,
        item.cartQuantity.toString(),
        `${price.toFixed(2)} FCFA`,
        `${subtotal.toFixed(2)} FCFA`
      ];
      tableRows.push(row);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 70,
    });

    const finalY = (doc as any).lastAutoTable.finalY || 70;
    doc.setFontSize(16);
    doc.text(`Total à payer : ${this.getTotal().toFixed(2)} FCFA`, 14, finalY + 15);

    doc.save(`facture_${new Date().getTime()}.pdf`);
  }
}
