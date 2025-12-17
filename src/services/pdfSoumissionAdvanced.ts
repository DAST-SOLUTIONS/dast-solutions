/**
 * DAST Solutions - Service PDF Soumissions Professionnelles
 * Génération de soumissions PDF avec templates personnalisables
 */
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

// ============================================================================
// TYPES
// ============================================================================
export interface SoumissionData {
  numero: string;
  date: string;
  validite: number; // jours
  
  // Entreprise
  entreprise: {
    nom: string;
    adresse: string;
    ville: string;
    province: string;
    codePostal: string;
    telephone: string;
    courriel: string;
    siteWeb?: string;
    rbq?: string;
    neq?: string;
    logo?: string; // base64
  };
  
  // Client
  client: {
    nom: string;
    entreprise?: string;
    adresse: string;
    ville: string;
    province: string;
    codePostal: string;
    telephone?: string;
    courriel?: string;
  };
  
  // Projet
  projet: {
    nom: string;
    adresse?: string;
    description?: string;
    dateDebut?: string;
    dateFin?: string;
  };
  
  // Items
  items: SoumissionItem[];
  
  // Montants
  sousTotal: number;
  rabais?: number;
  rabaisType?: 'percent' | 'fixed';
  marge: number;
  margeType: 'percent' | 'fixed';
  tps: number;
  tvq: number;
  total: number;
  
  // Options
  conditions: string[];
  notes?: string;
  signature?: {
    nom: string;
    titre: string;
    date: string;
    image?: string; // base64
  };
}

export interface SoumissionItem {
  numero: number;
  description: string;
  categorie: string;
  quantite: number;
  unite: string;
  prixUnitaire: number;
  total: number;
  notes?: string;
}

export interface PDFTemplate {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: 'helvetica' | 'times' | 'courier';
  headerStyle: 'modern' | 'classic' | 'minimal';
  showLogo: boolean;
  showFooter: boolean;
  footerText: string;
  watermark?: string;
}

// ============================================================================
// TEMPLATES PAR DÉFAUT
// ============================================================================
export const DEFAULT_TEMPLATES: PDFTemplate[] = [
  {
    id: 'modern',
    name: 'Moderne',
    primaryColor: '#1E40AF',
    secondaryColor: '#3B82F6',
    accentColor: '#60A5FA',
    fontFamily: 'helvetica',
    headerStyle: 'modern',
    showLogo: true,
    showFooter: true,
    footerText: 'Merci de votre confiance!'
  },
  {
    id: 'classic',
    name: 'Classique',
    primaryColor: '#1F2937',
    secondaryColor: '#4B5563',
    accentColor: '#9CA3AF',
    fontFamily: 'times',
    headerStyle: 'classic',
    showLogo: true,
    showFooter: true,
    footerText: 'Cette soumission est valide pour la période indiquée.'
  },
  {
    id: 'minimal',
    name: 'Minimaliste',
    primaryColor: '#000000',
    secondaryColor: '#374151',
    accentColor: '#6B7280',
    fontFamily: 'helvetica',
    headerStyle: 'minimal',
    showLogo: true,
    showFooter: false,
    footerText: ''
  },
  {
    id: 'construction',
    name: 'Construction Pro',
    primaryColor: '#B45309',
    secondaryColor: '#D97706',
    accentColor: '#FBBF24',
    fontFamily: 'helvetica',
    headerStyle: 'modern',
    showLogo: true,
    showFooter: true,
    footerText: 'Licence RBQ valide - Assurances complètes'
  }
];

// ============================================================================
// CONDITIONS PAR DÉFAUT
// ============================================================================
export const DEFAULT_CONDITIONS: string[] = [
  'Cette soumission est valide pour une période de 30 jours à compter de la date d\'émission.',
  'Un dépôt de 30% est requis à la signature du contrat.',
  'Les paiements progressifs seront facturés selon l\'avancement des travaux.',
  'Les travaux additionnels non prévus feront l\'objet d\'un avenant au contrat.',
  'Les délais de livraison sont donnés à titre indicatif et peuvent varier selon les conditions.',
  'Le client est responsable d\'obtenir les permis nécessaires sauf indication contraire.',
  'Une garantie de 1 an sur la main-d\'œuvre est incluse.',
  'Les prix n\'incluent pas les taxes applicables (TPS/TVQ).'
];

// ============================================================================
// GÉNÉRATEUR PDF
// ============================================================================
export function generateSoumissionPDF(
  data: SoumissionData,
  template: PDFTemplate = DEFAULT_TEMPLATES[0]
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let currentY = margin;
  
  // Couleurs
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };
  
  const primary = hexToRgb(template.primaryColor);
  const secondary = hexToRgb(template.secondaryColor);
  
  // ============================================================================
  // EN-TÊTE
  // ============================================================================
  if (template.headerStyle === 'modern') {
    // Barre colorée en haut
    doc.setFillColor(primary.r, primary.g, primary.b);
    doc.rect(0, 0, pageWidth, 25, 'F');
    
    // Logo ou nom entreprise
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont(template.fontFamily, 'bold');
    doc.text(data.entreprise.nom, margin, 17);
    
    // Numéro soumission à droite
    doc.setFontSize(12);
    doc.text(`SOUMISSION #${data.numero}`, pageWidth - margin, 12, { align: 'right' });
    doc.text(data.date, pageWidth - margin, 18, { align: 'right' });
    
    currentY = 35;
  } else if (template.headerStyle === 'classic') {
    // Nom entreprise centré
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.setFontSize(24);
    doc.setFont(template.fontFamily, 'bold');
    doc.text(data.entreprise.nom, pageWidth / 2, 20, { align: 'center' });
    
    // Ligne sous le titre
    doc.setDrawColor(primary.r, primary.g, primary.b);
    doc.setLineWidth(0.5);
    doc.line(margin, 25, pageWidth - margin, 25);
    
    // Infos entreprise
    doc.setFontSize(9);
    doc.setFont(template.fontFamily, 'normal');
    doc.setTextColor(secondary.r, secondary.g, secondary.b);
    const infoText = `${data.entreprise.adresse}, ${data.entreprise.ville}, ${data.entreprise.province} ${data.entreprise.codePostal} | Tél: ${data.entreprise.telephone} | ${data.entreprise.courriel}`;
    doc.text(infoText, pageWidth / 2, 32, { align: 'center' });
    
    currentY = 42;
  } else {
    // Minimal
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont(template.fontFamily, 'bold');
    doc.text(data.entreprise.nom, margin, 20);
    
    doc.setFontSize(10);
    doc.setFont(template.fontFamily, 'normal');
    doc.text(`${data.entreprise.adresse}, ${data.entreprise.ville}`, margin, 26);
    doc.text(`${data.entreprise.telephone} | ${data.entreprise.courriel}`, margin, 31);
    
    currentY = 42;
  }
  
  // ============================================================================
  // INFORMATIONS CLIENT & PROJET
  // ============================================================================
  const boxWidth = (pageWidth - margin * 2 - 10) / 2;
  
  // Box Client
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin, currentY, boxWidth, 35, 2, 2, 'F');
  
  doc.setTextColor(primary.r, primary.g, primary.b);
  doc.setFontSize(10);
  doc.setFont(template.fontFamily, 'bold');
  doc.text('CLIENT', margin + 5, currentY + 7);
  
  doc.setTextColor(50, 50, 50);
  doc.setFont(template.fontFamily, 'normal');
  doc.setFontSize(9);
  doc.text(data.client.nom, margin + 5, currentY + 14);
  if (data.client.entreprise) {
    doc.text(data.client.entreprise, margin + 5, currentY + 19);
  }
  doc.text(data.client.adresse, margin + 5, currentY + 24);
  doc.text(`${data.client.ville}, ${data.client.province} ${data.client.codePostal}`, margin + 5, currentY + 29);
  
  // Box Projet
  const projectBoxX = margin + boxWidth + 10;
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(projectBoxX, currentY, boxWidth, 35, 2, 2, 'F');
  
  doc.setTextColor(primary.r, primary.g, primary.b);
  doc.setFontSize(10);
  doc.setFont(template.fontFamily, 'bold');
  doc.text('PROJET', projectBoxX + 5, currentY + 7);
  
  doc.setTextColor(50, 50, 50);
  doc.setFont(template.fontFamily, 'normal');
  doc.setFontSize(9);
  doc.text(data.projet.nom, projectBoxX + 5, currentY + 14);
  if (data.projet.adresse) {
    doc.text(data.projet.adresse, projectBoxX + 5, currentY + 19);
  }
  if (data.projet.description) {
    const descLines = doc.splitTextToSize(data.projet.description, boxWidth - 10);
    doc.text(descLines.slice(0, 2), projectBoxX + 5, currentY + 24);
  }
  
  currentY += 45;
  
  // ============================================================================
  // TABLEAU DES ITEMS
  // ============================================================================
  // Grouper par catégorie
  const categories = [...new Set(data.items.map(i => i.categorie))];
  
  const tableData: any[] = [];
  
  categories.forEach(cat => {
    // Ligne de catégorie
    tableData.push([
      { content: cat.toUpperCase(), colSpan: 6, styles: { fillColor: [240, 240, 240], fontStyle: 'bold', fontSize: 9 } }
    ]);
    
    // Items de cette catégorie
    data.items
      .filter(i => i.categorie === cat)
      .forEach(item => {
        tableData.push([
          item.numero,
          item.description,
          item.quantite.toFixed(2),
          item.unite,
          `${item.prixUnitaire.toFixed(2)} $`,
          `${item.total.toFixed(2)} $`
        ]);
      });
  });
  
  doc.autoTable({
    startY: currentY,
    head: [[
      { content: '#', styles: { halign: 'center' } },
      'Description',
      { content: 'Qté', styles: { halign: 'right' } },
      'Unité',
      { content: 'Prix unit.', styles: { halign: 'right' } },
      { content: 'Total', styles: { halign: 'right' } }
    ]],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [primary.r, primary.g, primary.b],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20, halign: 'right' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 28, halign: 'right' }
    },
    margin: { left: margin, right: margin },
    didDrawPage: (data: any) => {
      // Numéro de page
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${doc.getCurrentPageInfo().pageNumber}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
  });
  
  currentY = doc.lastAutoTable.finalY + 10;
  
  // ============================================================================
  // TOTAUX
  // ============================================================================
  const totalsX = pageWidth - margin - 80;
  
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(totalsX - 5, currentY - 3, 85, 55, 2, 2, 'F');
  
  doc.setFont(template.fontFamily, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  
  // Sous-total
  doc.text('Sous-total:', totalsX, currentY + 5);
  doc.text(`${data.sousTotal.toFixed(2)} $`, pageWidth - margin, currentY + 5, { align: 'right' });
  
  // Rabais
  if (data.rabais && data.rabais > 0) {
    currentY += 6;
    const rabaisText = data.rabaisType === 'percent' ? `Rabais (${data.rabais}%):` : 'Rabais:';
    const rabaisMontant = data.rabaisType === 'percent' ? data.sousTotal * data.rabais / 100 : data.rabais;
    doc.setTextColor(34, 139, 34);
    doc.text(rabaisText, totalsX, currentY + 5);
    doc.text(`-${rabaisMontant.toFixed(2)} $`, pageWidth - margin, currentY + 5, { align: 'right' });
    doc.setTextColor(80, 80, 80);
  }
  
  // Marge
  if (data.marge > 0) {
    currentY += 6;
    const margeText = data.margeType === 'percent' ? `Profit & frais (${data.marge}%):` : 'Profit & frais:';
    doc.text(margeText, totalsX, currentY + 5);
    const margeMontant = data.margeType === 'percent' 
      ? (data.sousTotal - (data.rabais || 0)) * data.marge / 100 
      : data.marge;
    doc.text(`${margeMontant.toFixed(2)} $`, pageWidth - margin, currentY + 5, { align: 'right' });
  }
  
  // TPS
  currentY += 6;
  doc.text('TPS (5%):', totalsX, currentY + 5);
  doc.text(`${data.tps.toFixed(2)} $`, pageWidth - margin, currentY + 5, { align: 'right' });
  
  // TVQ
  currentY += 6;
  doc.text('TVQ (9.975%):', totalsX, currentY + 5);
  doc.text(`${data.tvq.toFixed(2)} $`, pageWidth - margin, currentY + 5, { align: 'right' });
  
  // Total
  currentY += 8;
  doc.setDrawColor(primary.r, primary.g, primary.b);
  doc.setLineWidth(0.5);
  doc.line(totalsX, currentY, pageWidth - margin, currentY);
  
  doc.setFont(template.fontFamily, 'bold');
  doc.setFontSize(12);
  doc.setTextColor(primary.r, primary.g, primary.b);
  doc.text('TOTAL:', totalsX, currentY + 8);
  doc.text(`${data.total.toFixed(2)} $`, pageWidth - margin, currentY + 8, { align: 'right' });
  
  currentY += 20;
  
  // ============================================================================
  // CONDITIONS
  // ============================================================================
  if (data.conditions.length > 0) {
    // Vérifier si on a assez d'espace
    if (currentY > pageHeight - 80) {
      doc.addPage();
      currentY = margin;
    }
    
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.setFontSize(11);
    doc.setFont(template.fontFamily, 'bold');
    doc.text('CONDITIONS', margin, currentY);
    
    currentY += 6;
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(8);
    doc.setFont(template.fontFamily, 'normal');
    
    data.conditions.forEach((condition, index) => {
      const lines = doc.splitTextToSize(`${index + 1}. ${condition}`, pageWidth - margin * 2);
      
      if (currentY + lines.length * 4 > pageHeight - 30) {
        doc.addPage();
        currentY = margin;
      }
      
      doc.text(lines, margin, currentY);
      currentY += lines.length * 4 + 2;
    });
  }
  
  // ============================================================================
  // NOTES
  // ============================================================================
  if (data.notes) {
    currentY += 5;
    
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = margin;
    }
    
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.setFontSize(11);
    doc.setFont(template.fontFamily, 'bold');
    doc.text('NOTES', margin, currentY);
    
    currentY += 6;
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont(template.fontFamily, 'normal');
    
    const notesLines = doc.splitTextToSize(data.notes, pageWidth - margin * 2);
    doc.text(notesLines, margin, currentY);
    currentY += notesLines.length * 5;
  }
  
  // ============================================================================
  // SIGNATURE
  // ============================================================================
  if (data.signature) {
    currentY += 10;
    
    if (currentY > pageHeight - 45) {
      doc.addPage();
      currentY = margin;
    }
    
    doc.setTextColor(primary.r, primary.g, primary.b);
    doc.setFontSize(11);
    doc.setFont(template.fontFamily, 'bold');
    doc.text('ACCEPTATION', margin, currentY);
    
    currentY += 8;
    
    // Zone signature client
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(margin, currentY + 15, margin + 70, currentY + 15);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont(template.fontFamily, 'normal');
    doc.text('Signature du client', margin, currentY + 20);
    doc.line(margin + 80, currentY + 15, margin + 130, currentY + 15);
    doc.text('Date', margin + 80, currentY + 20);
    
    // Signature entreprise (si fournie)
    currentY += 30;
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9);
    doc.text('Préparé par:', margin, currentY);
    doc.setFont(template.fontFamily, 'bold');
    doc.text(data.signature.nom, margin + 25, currentY);
    doc.setFont(template.fontFamily, 'normal');
    if (data.signature.titre) {
      doc.text(data.signature.titre, margin + 25, currentY + 5);
    }
    
    // Image signature si fournie
    if (data.signature.image) {
      try {
        doc.addImage(data.signature.image, 'PNG', pageWidth - margin - 50, currentY - 10, 40, 20);
      } catch (e) {
        console.warn('Erreur ajout signature image:', e);
      }
    }
  }
  
  // ============================================================================
  // PIED DE PAGE
  // ============================================================================
  if (template.showFooter) {
    const totalPages = doc.getNumberOfPages();
    
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Ligne séparatrice
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
      
      // Texte pied de page
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.setFont(template.fontFamily, 'normal');
      
      if (template.footerText) {
        doc.text(template.footerText, margin, pageHeight - 14);
      }
      
      // RBQ si disponible
      if (data.entreprise.rbq) {
        doc.text(`RBQ: ${data.entreprise.rbq}`, pageWidth / 2, pageHeight - 14, { align: 'center' });
      }
      
      // Numéro de page
      doc.text(`Page ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 14, { align: 'right' });
    }
  }
  
  return doc;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculer les montants d'une soumission
 */
export function calculateSoumissionTotals(
  items: SoumissionItem[],
  margePercent: number = 0,
  rabaisPercent: number = 0
): { sousTotal: number; rabais: number; marge: number; tps: number; tvq: number; total: number } {
  const sousTotal = items.reduce((sum, item) => sum + item.total, 0);
  const rabais = sousTotal * rabaisPercent / 100;
  const apresRabais = sousTotal - rabais;
  const marge = apresRabais * margePercent / 100;
  const avantTaxes = apresRabais + marge;
  const tps = avantTaxes * 0.05;
  const tvq = avantTaxes * 0.09975;
  const total = avantTaxes + tps + tvq;
  
  return { sousTotal, rabais, marge, tps, tvq, total };
}

/**
 * Générer un numéro de soumission
 */
export function generateSoumissionNumber(prefix: string = 'SOU'): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `${prefix}-${year}${month}-${random}`;
}

/**
 * Télécharger le PDF
 */
export function downloadSoumissionPDF(
  data: SoumissionData,
  template?: PDFTemplate,
  filename?: string
): void {
  const doc = generateSoumissionPDF(data, template);
  const name = filename || `Soumission_${data.numero}_${data.client.nom.replace(/\s+/g, '_')}.pdf`;
  doc.save(name);
}

/**
 * Obtenir le blob PDF pour preview ou envoi par email
 */
export function getSoumissionPDFBlob(
  data: SoumissionData,
  template?: PDFTemplate
): Blob {
  const doc = generateSoumissionPDF(data, template);
  return doc.output('blob');
}

export default {
  generateSoumissionPDF,
  calculateSoumissionTotals,
  generateSoumissionNumber,
  downloadSoumissionPDF,
  getSoumissionPDFBlob,
  DEFAULT_TEMPLATES,
  DEFAULT_CONDITIONS
};
