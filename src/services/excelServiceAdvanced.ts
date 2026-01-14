/**
 * Service Excel Avancé - Export/Import avec formatage
 */
import { excelService } from './excelService';

export interface ExcelAdvancedOptions {
  filename: string;
  sheets?: Array<{
    name: string;
    data: any[];
    columns?: Array<{
      header: string;
      key: string;
      width?: number;
      format?: 'text' | 'number' | 'currency' | 'date' | 'percentage';
    }>;
  }>;
  title?: string;
  author?: string;
}

class ExcelServiceAdvanced {
  async exportWorkbook(options: ExcelAdvancedOptions): Promise<Blob> {
    // For now, export first sheet as CSV
    const firstSheet = options.sheets?.[0];
    if (!firstSheet) {
      return new Blob([''], { type: 'text/csv' });
    }
    
    return excelService.exportToExcel(firstSheet.data, {
      filename: options.filename,
      sheetName: firstSheet.name,
      headers: firstSheet.columns?.map(c => c.header)
    });
  }

  async exportEstimation(items: any[], projectName: string): Promise<void> {
    const data = items.map(item => ({
      'Code': item.code || '',
      'Description': item.description || '',
      'Quantité': item.quantity || 0,
      'Unité': item.unit || '',
      'Prix unitaire': item.unit_price || 0,
      'Matériaux': item.material_cost || 0,
      'Main-d\'œuvre': item.labor_cost || 0,
      'Total': item.total || 0
    }));

    excelService.downloadCSV(data, `estimation-${projectName}.csv`);
  }

  async exportSoumission(soumission: any): Promise<void> {
    const items = soumission.items?.map((item: any) => ({
      'Description': item.description,
      'Quantité': item.quantite,
      'Unité': item.unite,
      'Prix unitaire': item.prix_unitaire,
      'Montant': item.montant
    })) || [];

    // Add totals
    items.push({});
    items.push({ 'Description': 'Sous-total HT', 'Montant': soumission.montant_ht });
    items.push({ 'Description': 'TPS (5%)', 'Montant': soumission.tps });
    items.push({ 'Description': 'TVQ (9.975%)', 'Montant': soumission.tvq });
    items.push({ 'Description': 'TOTAL', 'Montant': soumission.montant_total });

    excelService.downloadCSV(items, `soumission-${soumission.numero}.csv`);
  }

  async importEstimation(file: File): Promise<any[]> {
    const data = await excelService.importFromExcel(file);
    return data.map(row => ({
      code: row['Code'],
      description: row['Description'],
      quantity: parseFloat(row['Quantité']) || 0,
      unit: row['Unité'],
      unit_price: parseFloat(row['Prix unitaire']) || 0,
      material_cost: parseFloat(row['Matériaux']) || 0,
      labor_cost: parseFloat(row['Main-d\'œuvre']) || 0,
      total: parseFloat(row['Total']) || 0
    }));
  }
}

export const excelServiceAdvanced = new ExcelServiceAdvanced();
export default excelServiceAdvanced;
