/**
 * DAST Solutions - Service Excel Bidirectionnel
 * Import/Export Excel avancé avec templates et validation
 */
import * as XLSX from 'xlsx';

// ============================================================================
// TYPES
// ============================================================================
export interface ExcelColumn {
  key: string;
  header: string;
  width?: number;
  type?: 'string' | 'number' | 'date' | 'currency' | 'percent';
  required?: boolean;
  validation?: (value: any) => boolean;
  transform?: (value: any) => any;
}

export interface ExcelTemplate {
  id: string;
  name: string;
  description: string;
  columns: ExcelColumn[];
  headerRow?: number;
  dataStartRow?: number;
  sheetName?: string;
}

export interface ImportResult<T> {
  success: boolean;
  data: T[];
  errors: ImportError[];
  warnings: string[];
  totalRows: number;
  validRows: number;
}

export interface ImportError {
  row: number;
  column: string;
  value: any;
  message: string;
}

// ============================================================================
// TEMPLATES PRÉDÉFINIS
// ============================================================================
export const EXCEL_TEMPLATES: Record<string, ExcelTemplate> = {
  estimation: {
    id: 'estimation',
    name: 'Estimation / Devis',
    description: 'Import/export des items d\'estimation',
    columns: [
      { key: 'numero', header: '#', width: 8, type: 'number' },
      { key: 'categorie', header: 'Catégorie', width: 20, type: 'string', required: true },
      { key: 'sousCategorie', header: 'Sous-catégorie', width: 20, type: 'string' },
      { key: 'description', header: 'Description', width: 50, type: 'string', required: true },
      { key: 'quantite', header: 'Quantité', width: 12, type: 'number', required: true },
      { key: 'unite', header: 'Unité', width: 10, type: 'string', required: true },
      { key: 'prixUnitaire', header: 'Prix unitaire', width: 15, type: 'currency', required: true },
      { key: 'total', header: 'Total', width: 15, type: 'currency' },
      { key: 'notes', header: 'Notes', width: 30, type: 'string' }
    ]
  },
  
  projets: {
    id: 'projets',
    name: 'Liste de projets',
    description: 'Import/export des projets',
    columns: [
      { key: 'numero', header: 'N° Projet', width: 15, type: 'string', required: true },
      { key: 'nom', header: 'Nom du projet', width: 40, type: 'string', required: true },
      { key: 'client', header: 'Client', width: 30, type: 'string', required: true },
      { key: 'adresse', header: 'Adresse', width: 40, type: 'string' },
      { key: 'ville', header: 'Ville', width: 20, type: 'string' },
      { key: 'dateDebut', header: 'Date début', width: 15, type: 'date' },
      { key: 'dateFin', header: 'Date fin', width: 15, type: 'date' },
      { key: 'budget', header: 'Budget', width: 15, type: 'currency' },
      { key: 'statut', header: 'Statut', width: 15, type: 'string' }
    ]
  },
  
  materiaux: {
    id: 'materiaux',
    name: 'Liste de prix matériaux',
    description: 'Import/export des prix de matériaux',
    columns: [
      { key: 'code', header: 'Code', width: 15, type: 'string', required: true },
      { key: 'description', header: 'Description', width: 50, type: 'string', required: true },
      { key: 'categorie', header: 'Catégorie', width: 20, type: 'string' },
      { key: 'unite', header: 'Unité', width: 10, type: 'string', required: true },
      { key: 'prixUnitaire', header: 'Prix unitaire', width: 15, type: 'currency', required: true },
      { key: 'fournisseur', header: 'Fournisseur', width: 25, type: 'string' }
    ]
  },
  
  takeoff: {
    id: 'takeoff',
    name: 'Relevé de quantités',
    description: 'Import/export des mesures de takeoff',
    columns: [
      { key: 'page', header: 'Page', width: 8, type: 'number' },
      { key: 'layer', header: 'Calque', width: 15, type: 'string' },
      { key: 'type', header: 'Type', width: 15, type: 'string', required: true },
      { key: 'description', header: 'Description', width: 40, type: 'string' },
      { key: 'quantite', header: 'Quantité', width: 12, type: 'number', required: true },
      { key: 'unite', header: 'Unité', width: 10, type: 'string', required: true },
      { key: 'prixUnitaire', header: 'Prix unit.', width: 15, type: 'currency' },
      { key: 'total', header: 'Total', width: 15, type: 'currency' }
    ]
  }
};

// ============================================================================
// SERVICE
// ============================================================================
class ExcelService {
  
  async importFile<T extends Record<string, any>>(
    file: File,
    template: ExcelTemplate
  ): Promise<ImportResult<T>> {
    const result: ImportResult<T> = {
      success: false,
      data: [],
      errors: [],
      warnings: [],
      totalRows: 0,
      validRows: 0
    };
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      const rawData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1, defval: '' });
      
      if (rawData.length === 0) {
        result.warnings.push('Le fichier est vide');
        return result;
      }
      
      const headers = rawData[0] as string[];
      const columnMap = this.mapColumns(headers, template.columns);
      
      for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i] as any[];
        if (!row || row.every(cell => cell === '' || cell === null)) continue;
        
        result.totalRows++;
        const item: Record<string, any> = {};
        let rowValid = true;
        
        for (const col of template.columns) {
          const colIndex = columnMap.get(col.key);
          if (colIndex === undefined) continue;
          
          let value = row[colIndex];
          value = this.transformValue(value, col.type);
          
          if (col.required && (value === null || value === '')) {
            result.errors.push({ row: i + 1, column: col.header, value, message: 'Valeur requise' });
            rowValid = false;
          }
          
          item[col.key] = value;
        }
        
        if (rowValid) {
          result.data.push(item as T);
          result.validRows++;
        }
      }
      
      result.success = result.validRows > 0;
    } catch (error) {
      result.errors.push({ row: 0, column: '', value: '', message: `Erreur: ${error}` });
    }
    
    return result;
  }
  
  private mapColumns(headers: string[], columns: ExcelColumn[]): Map<string, number> {
    const map = new Map<string, number>();
    for (const col of columns) {
      const index = headers.findIndex(h => 
        h?.toString().toLowerCase().trim() === col.header.toLowerCase().trim()
      );
      if (index !== -1) map.set(col.key, index);
    }
    return map;
  }
  
  private transformValue(value: any, type?: string): any {
    if (value === null || value === undefined || value === '') return null;
    
    switch (type) {
      case 'number':
      case 'currency':
        const num = parseFloat(value.toString().replace(/[^\d.,\-]/g, '').replace(',', '.'));
        return isNaN(num) ? null : num;
      case 'date':
        return value instanceof Date ? value : new Date(value);
      default:
        return value.toString().trim();
    }
  }
  
  exportToExcel<T extends Record<string, any>>(
    data: T[],
    template: ExcelTemplate,
    filename: string
  ): void {
    const headers = template.columns.map(col => col.header);
    const rows = data.map(item => template.columns.map(col => item[col.key] ?? ''));
    
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    worksheet['!cols'] = template.columns.map(col => ({ wch: col.width || 15 }));
    
    XLSX.utils.book_append_sheet(workbook, worksheet, template.name);
    XLSX.writeFile(workbook, filename);
  }
  
  exportToCSV<T extends Record<string, any>>(data: T[], template: ExcelTemplate, filename: string): void {
    const headers = template.columns.map(col => col.header);
    const rows = data.map(item => 
      template.columns.map(col => {
        let value = item[col.key] ?? '';
        if (value.toString().includes(',')) value = `"${value}"`;
        return value;
      }).join(',')
    );
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }
  
  downloadTemplate(template: ExcelTemplate): void {
    const headers = template.columns.map(col => col.header);
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    worksheet['!cols'] = template.columns.map(col => ({ wch: col.width || 15 }));
    XLSX.utils.book_append_sheet(workbook, worksheet, template.name);
    XLSX.writeFile(workbook, `template_${template.id}.xlsx`);
  }
  
  async getSheetNames(file: File): Promise<string[]> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    return workbook.SheetNames;
  }
  
  async previewFile(file: File, rows: number = 10): Promise<any[][]> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });
    return data.slice(0, rows);
  }
}

export const excelService = new ExcelService();
export default excelService;
