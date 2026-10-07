import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
    const csvContent = [headers.join(','), ...rows.map(r => r.map(this.escapeCsv).join(','))].join('\n');
    this.downloadBlob(filename.endsWith('.csv') ? filename : `${filename}.csv`, new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
  }

  downloadExcel(filename: string, sheetName: string, headers: string[], rows: (string | number)[][]): void {
    const data = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
    XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
  }

  downloadPdf(
    filename: string,
    title: string,
    headers: string[],
    rows: (string | number)[][],
    footer?: string
  ): void {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(title, 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, 14, 26);

    autoTable(doc, {
      head: [headers],
      body: rows.map(r => r.map(String)),
      startY: 32
    });

    if (footer) {
      const finalY = (doc as any).lastAutoTable?.finalY || 32;
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(footer, 14, finalY + 12);
    }

    doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
  }

  private escapeCsv(value: string | number): string {
    const s = String(value ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  private downloadBlob(filename: string, blob: Blob): void {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
