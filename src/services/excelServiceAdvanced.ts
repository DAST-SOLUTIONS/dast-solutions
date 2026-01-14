/**
 * Service Excel Advanced - Import/Export Excel pour estimations
 */
import * as XLSX from 'xlsx';

export interface ExcelTemplate {
  id: string;
  name: string;
  description: string;
  estimation?: boolean;
}

export const EXCEL_TEMPLATES: ExcelTemplate[] = [
  { id: 'estimation', name: 'Estimation', description: 'Modèle d\'estimation de construction', estimation: true },
  { id: 'soumission', name: 'Soumission', description: 'Modèle de soumission', estimation: false },
  { id: 'facture', name: 'Facture', description: 'Modèle de facture', estimation: false },
  { id: 'materiaux', name: 'Liste matériaux', description: 'Liste des matériaux', estimation: true }
];

export interface ExcelImportResult {
  items: any[];
  errors: string[];
  success: boolean;
}

export class ExcelService {
  // Export estimation to Excel
  exportEstimation(estimation: any, filename?: string): void {
    const items = estimation.items || [];
    
    const data = items.map((item: any, index: number) => ({
      'No': item.numero || index + 1,
      'Description': item.description,
      'Catégorie': item.categorie || item.category || '',
      'Quantité': item.quantite || item.quantity || 0,
      'Unité': item.unite || item.unit || '',
      'Prix unitaire': item.prix_unitaire || item.prixUnitaire || item.unit_price || 0,
      'Total': item.montant || item.total || item.total_price || 0,
      'Notes': item.notes || ''
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Estimation');
    
    const name = filename || `estimation-${Date.now()}.xlsx`;
    XLSX.writeFile(wb, name);
  }

  // Import file
  async importFile(file: File): Promise<ExcelImportResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          const items = jsonData.map((row: any, index: number) => ({
            id: `import-${index}`,
            numero: row['No'] || row['Numero'] || index + 1,
            description: row['Description'] || row['description'] || '',
            categorie: row['Catégorie'] || row['categorie'] || row['Category'] || '',
            quantite: parseFloat(row['Quantité'] || row['quantite'] || row['Quantity'] || 0),
            unite: row['Unité'] || row['unite'] || row['Unit'] || '',
            prix_unitaire: parseFloat(row['Prix unitaire'] || row['prix_unitaire'] || row['Unit Price'] || 0),
            prixUnitaire: parseFloat(row['Prix unitaire'] || row['prix_unitaire'] || row['Unit Price'] || 0),
            montant: parseFloat(row['Total'] || row['montant'] || row['total'] || 0),
            total: parseFloat(row['Total'] || row['montant'] || row['total'] || 0),
            notes: row['Notes'] || row['notes'] || '',
            source: 'imported' as const
          }));
          
          resolve({
            items,
            errors: [],
            success: true
          });
        } catch (error: any) {
          resolve({
            items: [],
            errors: [error.message],
            success: false
          });
        }
      };
      
      reader.onerror = () => {
        resolve({
          items: [],
          errors: ['Erreur lors de la lecture du fichier'],
          success: false
        });
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  // Download template
  downloadTemplate(templateId: string): void {
    const template = EXCEL_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    
    let headers: string[];
    switch (templateId) {
      case 'estimation':
        headers = ['No', 'Description', 'Catégorie', 'Quantité', 'Unité', 'Prix unitaire', 'Total', 'Notes'];
        break;
      case 'soumission':
        headers = ['Description', 'Quantité', 'Unité', 'Prix unitaire', 'Montant'];
        break;
      case 'facture':
        headers = ['Description', 'Quantité', 'Prix unitaire', 'Montant'];
        break;
      case 'materiaux':
        headers = ['Code', 'Nom', 'Catégorie', 'Unité', 'Prix', 'Fournisseur'];
        break;
      default:
        headers = ['Description', 'Quantité', 'Prix'];
    }
    
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, template.name);
    XLSX.writeFile(wb, `modele-${templateId}.xlsx`);
  }

  // Export items to Excel
  exportItems(items: any[], filename: string): void {
    const ws = XLSX.utils.json_to_sheet(items);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, filename);
  }
}

export const excelService = new ExcelService();
export default excelService;
