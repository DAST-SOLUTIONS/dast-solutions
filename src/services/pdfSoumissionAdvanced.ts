/**
 * Service PDF Soumission Avancé
 */
import pdfSoumissionService from './pdfSoumissionService';
import type { SoumissionPDFData } from './pdfSoumissionService';

export type { SoumissionPDFData };

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
    return pdfSoumissionService.generateSoumissionPDF(data);
  }

  async generateWithTemplate(data: SoumissionPDFData, templateId: string): Promise<Blob> {
    return pdfSoumissionService.generateSoumissionPDF(data);
  }

  async batchGenerate(soumissions: SoumissionPDFData[]): Promise<Blob[]> {
    return Promise.all(soumissions.map(s => this.generatePDF(s)));
  }
}

export const pdfSoumissionAdvanced = new PDFSoumissionAdvanced();
export default pdfSoumissionAdvanced;
