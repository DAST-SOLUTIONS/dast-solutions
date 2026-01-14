/**
 * Service Excel - Export/Import de données
 */

export interface ExcelExportOptions {
  filename: string;
  sheetName?: string;
  headers?: string[];
  includeStyles?: boolean;
}

class ExcelService {
  async exportToExcel(data: any[], options: ExcelExportOptions): Promise<Blob> {
    // Generate CSV as fallback (in production, use xlsx library)
    const headers = options.headers || Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n');
    
    return new Blob([csvContent], { type: 'text/csv' });
  }

  async importFromExcel(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
          const data = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.replace(/"/g, '').trim());
            return headers.reduce((obj, h, i) => ({ ...obj, [h]: values[i] }), {});
          });
          resolve(data);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  downloadCSV(data: any[], filename: string): void {
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const excelService = new ExcelService();

// Helper function for soumission export
export function exportSoumissionToExcel(soumission: any): void {
  const items = soumission.items?.map((item: any) => ({
    'Description': item.description,
    'Quantité': item.quantite || item.quantity,
    'Unité': item.unite || item.unit,
    'Prix unitaire': item.prix_unitaire || item.unit_price,
    'Montant': item.montant || item.total
  })) || [];

  excelService.downloadCSV(items, `soumission-${soumission.numero || 'export'}.csv`);
}

export default excelService;
