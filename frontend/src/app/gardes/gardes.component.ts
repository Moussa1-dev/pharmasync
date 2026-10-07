import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { AuthService } from '../auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-gardes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gardes.component.html',
  styleUrls: ['./gardes.component.css']
})
export class GardesComponent implements OnInit {
  pharmacies: any[] = [];
  schedules: any[] = [];
  onCallNow: any[] = [];
  weekStart: string = '';
  loading = false;

  form = {
    pharmacyId: 1 as number | string,
    dutyDate: '',
    shiftType: 'JOUR',
    startTime: '08:00',
    endTime: '20:00',
    notes: ''
  };

  constructor(private api: ApiService, public auth: AuthService) {}

  ngOnInit(): void {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    this.weekStart = monday.toISOString().slice(0, 10);
    this.form.dutyDate = today.toISOString().slice(0, 10);

    this.api.getAllPharmacies().subscribe(data => {
      this.pharmacies = data || [];
      if (this.pharmacies.length) {
        const activeId = this.auth.getActivePharmacyId();
        this.form.pharmacyId = this.pharmacies.some(p => p.id === activeId) ? activeId : this.pharmacies[0].id;
      }
    });
    this.reload();
  }

  weekDays(): Date[] {
    const start = new Date(this.weekStart + 'T00:00:00');
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }

  reload(): void {
    this.loading = true;
    const start = this.weekStart;
    const endDate = new Date(this.weekStart + 'T00:00:00');
    endDate.setDate(endDate.getDate() + 6);
    const end = endDate.toISOString().slice(0, 10);

    this.api.getDutySchedules({ start, end }).subscribe({
      next: (data) => {
        this.schedules = data || [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });

    this.api.getOnCallNow().subscribe({
      next: (data) => this.onCallNow = data || [],
      error: () => this.onCallNow = []
    });
  }

  prevWeek(): void {
    const d = new Date(this.weekStart + 'T00:00:00');
    d.setDate(d.getDate() - 7);
    this.weekStart = d.toISOString().slice(0, 10);
    this.reload();
  }

  nextWeek(): void {
    const d = new Date(this.weekStart + 'T00:00:00');
    d.setDate(d.getDate() + 7);
    this.weekStart = d.toISOString().slice(0, 10);
    this.reload();
  }

  schedulesFor(day: Date): any[] {
    const key = day.toISOString().slice(0, 10);
    return this.schedules.filter(s => s.dutyDate === key);
  }

  shiftLabel(type: string): string {
    if (type === 'NUIT') return 'Nuit';
    if (type === 'WEEKEND') return 'Week-end';
    return 'Jour';
  }

  onShiftChange(): void {
    if (this.form.shiftType === 'NUIT') {
      this.form.startTime = '20:00';
      this.form.endTime = '08:00';
    } else {
      this.form.startTime = '08:00';
      this.form.endTime = '20:00';
    }
  }

  save(): void {
    if (!this.form.pharmacyId || !this.form.dutyDate) {
      Swal.fire('Champs requis', 'Pharmacie et date obligatoires.', 'warning');
      return;
    }
    const payload = {
      pharmacyId: Number(this.form.pharmacyId),
      dutyDate: this.form.dutyDate,
      shiftType: this.form.shiftType,
      startTime: this.form.startTime,
      endTime: this.form.endTime,
      notes: this.form.notes
    };
    this.api.createDutySchedule(payload).subscribe({
      next: () => {
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Garde planifiée', showConfirmButton: false, timer: 2000 });
        this.reload();
      },
      error: (err) => Swal.fire('Erreur', err.error || 'Impossible d\'enregistrer la garde.', 'error')
    });
  }

  remove(id: number): void {
    Swal.fire({
      title: 'Supprimer cette garde ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui'
    }).then(res => {
      if (!res.isConfirmed) return;
      this.api.deleteDutySchedule(id).subscribe({
        next: () => this.reload(),
        error: () => Swal.fire('Erreur', 'Suppression impossible.', 'error')
      });
    });
  }
}
