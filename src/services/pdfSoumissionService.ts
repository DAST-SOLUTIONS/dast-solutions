/**
 * Service PDF Soumission - Génération et téléchargement de soumissions PDF
 */
import jsPDF from 'jspdf';
import type { Soumission, SoumissionItem } from '@/hooks/useSoumissions';

export interface SoumissionPDFData {
  entreprise: {
    name: string;
    nom?: string;
    address: string;
    phone: string;
    email: string;
    rbq_license?: string;
    neq?: string;
  };
  soumission: Soumission;
  items: SoumissionItem[];
}

export async function generateSoumissionPDF(data: Soumission | SoumissionPDFData): Promise<Blob> {
  const doc = new jsPDF();
  
  const soumission = 'soumission' in data ? data.soumission : data;
  
  doc.setFontSize(20);
  doc.text('SOUMISSION', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Numéro: ${soumission.numero || 'N/A'}`, 20, 40);
  doc.text(`Date: ${new Date(soumission.date_creation).toLocaleDateString('fr-CA')}`, 20, 50);
  doc.text(`Client: ${soumission.client_name || soumission.client_nom || 'N/A'}`, 20, 60);
  doc.text(`Projet: ${soumission.project_name || soumission.projet_nom || 'N/A'}`, 20, 70);
  
  let y = 90;
  doc.setFontSize(14);
  doc.text('Description', 20, y);
  doc.text('Montant', 160, y);
  
  y += 10;
  doc.setFontSize(10);
  
  const items = soumission.items || [];
  items.forEach((item) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.text(item.description.substring(0, 50), 20, y);
    doc.text(`${(item.montant || item.total_price || 0).toFixed(2)} $`, 160, y);
    y += 8;
  });
  
  y += 20;
  doc.setFontSize(12);
  doc.text(`Sous-total: ${soumission.montant_ht?.toFixed(2) || '0.00'} $`, 140, y);
  y += 8;
  doc.text(`TPS (5%): ${soumission.tps?.toFixed(2) || '0.00'} $`, 140, y);
  y += 8;
  doc.text(`TVQ (9.975%): ${soumission.tvq?.toFixed(2) || '0.00'} $`, 140, y);
  y += 10;
  doc.setFontSize(14);
  doc.text(`TOTAL: ${soumission.montant_total?.toFixed(2) || '0.00'} $`, 140, y);
  
  return doc.output('blob');
}

export async function downloadSoumissionPDF(data: Soumission | SoumissionPDFData): Promise<void> {
  const blob = await generateSoumissionPDF(data);
  const soumission = 'soumission' in data ? data.soumission : data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `soumission-${soumission.numero || 'draft'}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function openSoumissionPDF(data: Soumission | SoumissionPDFData): Promise<void> {
  const blob = await generateSoumissionPDF(data);
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

export default {
  generateSoumissionPDF,
  downloadSoumissionPDF,
  openSoumissionPDF
};
