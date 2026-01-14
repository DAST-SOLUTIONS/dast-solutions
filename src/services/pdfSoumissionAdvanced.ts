/**
 * Service PDF Soumission Avancé
 */
import { pdfSoumissionService, type SoumissionPDFData } from './pdfSoumissionService';

export interface PDFAdvancedOptions {
  template?: 'modern' | 'classic' | 'minimal';
  logo?: string;
  primaryColor?: string;
  includeTerms?: boolean;
  watermark?: string;
}

class PDFSoumissionAdvanced {
  async generatePDF(data: SoumissionPDFData, options?: PDFAdvancedOptions): Promise<Blob> {
    // Use base service for now
    return pdfSoumissionService.generatePDF(data);
  }

  async generateWithTemplate(data: SoumissionPDFData, templateId: string): Promise<Blob> {
    return pdfSoumissionService.generatePDF(data);
  }

  async batchGenerate(soumissions: SoumissionPDFData[]): Promise<Blob[]> {
    return Promise.all(soumissions.map(s => this.generatePDF(s)));
  }
}

export const pdfSoumissionAdvanced = new PDFSoumissionAdvanced();
export default pdfSoumissionAdvanced;
