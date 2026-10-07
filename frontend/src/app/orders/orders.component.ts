import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../api.service';
import { AuthService } from '../auth.service';
import Swal from 'sweetalert2';

interface PharmacyOrder {
  id: number;
  supplierName: string;
  medicationName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  expectedDate: string;
  status: string;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit {
  suppliers: any[] = [];
  medications: any[] = [];
  orders: PharmacyOrder[] = [];
  selectedFilter = 'all';
  pharmacyId = 1;
  usingApi = false;

  form = {
    supplierId: '',
    medicationName: '',
    quantity: 1,
    unitPrice: 0,
    expectedDate: ''
  };

  constructor(private apiService: ApiService, private route: ActivatedRoute, public auth: AuthService) {}

  ngOnInit(): void {
    this.pharmacyId = this.auth.getActivePharmacyId();
    this.auth.activePharmacyId$.subscribe(id => {
      if (id != null) {
        this.pharmacyId = id;
        this.loadOrders();
      }
    });
    this.loadSuppliers();
    this.loadMedications();
    this.loadOrders();

    this.route.queryParamMap.subscribe(params => {
      const med = params.get('medication');
      const qty = params.get('qty');
      if (med) {
        this.form.medicationName = med;
      }
      if (qty) {
        this.form.quantity = Number(qty) || 50;
      }
    });
  }

  loadSuppliers(): void {
    this.apiService.getSuppliers().subscribe({
      next: (data) => this.suppliers = data,
      error: (err) => console.error(err)
    });
  }

  loadMedications(): void {
    this.apiService.getAllMedications().subscribe({
      next: (data) => this.medications = data,
      error: (err) => console.error(err)
    });
  }

  loadOrders(): void {
    this.apiService.getSupplierOrders(this.pharmacyId).subscribe({
      next: (data) => {
        this.usingApi = true;
        this.orders = (data || []).map((o: any) => ({
          id: o.id,
          supplierName: o.supplierName,
          medicationName: o.medicationName,
          quantity: o.quantity,
          unitPrice: o.unitPrice,
          total: o.total,
          expectedDate: o.expectedDate,
          status: this.mapStatus(o.status)
        }));
        if (this.orders.length === 0) {
          this.loadLocalFallback();
        }
      },
      error: () => this.loadLocalFallback()
    });
  }

  private mapStatus(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmée',
      RECEIVED: 'Reçue',
      CANCELLED: 'Annulée'
    };
    return map[status] || status;
  }

  private reverseStatus(status: string): string {
    const map: Record<string, string> = {
      'En attente': 'PENDING',
      'Confirmée': 'CONFIRMED',
      'Reçue': 'RECEIVED',
      'Annulée': 'CANCELLED'
    };
    return map[status] || 'PENDING';
  }

  loadLocalFallback(): void {
    const saved = localStorage.getItem('pharma-orders');
    if (saved) {
      this.orders = JSON.parse(saved);
      return;
    }
    this.orders = [];
  }

  saveOrders(): void {
    localStorage.setItem('pharma-orders', JSON.stringify(this.orders));
  }

  onSubmit(): void {
    if (!this.form.medicationName || !this.form.supplierId || this.form.quantity <= 0) {
      return;
    }

    const supplier = this.suppliers.find(item => String(item.id) === String(this.form.supplierId));
    const payload = {
      pharmacyId: this.pharmacyId,
      supplierName: supplier?.name ?? 'Fournisseur',
      medicationName: this.form.medicationName,
      quantity: this.form.quantity,
      unitPrice: Number(this.form.unitPrice) || 0,
      expectedDate: this.form.expectedDate || new Date().toISOString().slice(0, 10),
      status: 'PENDING'
    };

    this.apiService.createSupplierOrder(payload).subscribe({
      next: (saved) => {
        this.orders = [{
          id: saved.id,
          supplierName: saved.supplierName,
          medicationName: saved.medicationName,
          quantity: saved.quantity,
          unitPrice: saved.unitPrice,
          total: saved.total,
          expectedDate: saved.expectedDate,
          status: this.mapStatus(saved.status)
        }, ...this.orders];
        this.resetForm();
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Commande enregistrée', showConfirmButton: false, timer: 2000 });
      },
      error: () => {
        const newOrder: PharmacyOrder = {
          id: Date.now(),
          supplierName: supplier?.name ?? 'Fournisseur',
          medicationName: this.form.medicationName,
          quantity: this.form.quantity,
          unitPrice: Number(this.form.unitPrice) || 0,
          total: Number(this.form.unitPrice) * this.form.quantity,
          expectedDate: this.form.expectedDate || new Date().toISOString().slice(0, 10),
          status: 'En attente'
        };
        this.orders = [newOrder, ...this.orders];
        this.saveOrders();
        this.resetForm();
      }
    });
  }

  resetForm(): void {
    this.form = {
      supplierId: '',
      medicationName: '',
      quantity: 1,
      unitPrice: 0,
      expectedDate: ''
    };
  }

  markReceived(id: number): void {
    this.apiService.updateSupplierOrderStatus(id, 'RECEIVED').subscribe({
      next: () => {
        this.orders = this.orders.map(order =>
          order.id === id ? { ...order, status: 'Reçue' } : order
        );
      },
      error: () => {
        this.orders = this.orders.map(order =>
          order.id === id ? { ...order, status: 'Reçue' } : order
        );
        this.saveOrders();
      }
    });
  }

  get pendingOrdersCount(): number {
    return this.orders.filter(order => order.status === 'En attente').length;
  }

  get confirmedOrdersCount(): number {
    return this.orders.filter(order => order.status === 'Confirmée').length;
  }

  get receivedOrdersCount(): number {
    return this.orders.filter(order => order.status === 'Reçue').length;
  }

  get totalOrderValue(): number {
    return this.orders.reduce((sum, item) => sum + (item.total || 0), 0);
  }

  getOrderStatusClass(status: string): string {
    switch (status) {
      case 'En attente':
        return 'pending';
      case 'Confirmée':
        return 'confirmed';
      case 'Reçue':
        return 'received';
      default:
        return 'cancelled';
    }
  }

  filteredOrders(): PharmacyOrder[] {
    if (this.selectedFilter === 'all') {
      return this.orders;
    }
    return this.orders.filter(order => order.status === this.selectedFilter);
  }
}
