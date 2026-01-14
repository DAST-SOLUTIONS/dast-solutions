/**
 * Service PDF Facture - Génération de factures
 */

export interface FacturePDFData {
  id: string;
  numero: string;
  date_facture: string;
  date_echeance: string;
  client_name: string;
  client_address?: string;
  project_name?: string;
  items: Array<{
    description: string;
    quantite: number;
    unite: string;
    prix_unitaire: number;
    montant: number;
  }>;
  montant_ht: number;
  tps: number;
  tvq: number;
  montant_total: number;
  notes?: string;
  company_info?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    rbq_license?: string;
    neq?: string;
  };
  payment_info?: {
    bank_name?: string;
    transit?: string;
    account?: string;
  };
}

class PDFFactureService {
  async generatePDF(data: FacturePDFData): Promise<Blob> {
    const html = this.generateHTML(data);
    return new Blob([html], { type: 'text/html' });
  }

  private generateHTML(data: FacturePDFData): string {
    const itemsHTML = data.items.map(item => `
      <tr>
        <td>${item.description}</td>
        <td style="text-align: center">${item.quantite}</td>
        <td style="text-align: center">${item.unite}</td>
        <td style="text-align: right">${item.prix_unitaire.toFixed(2)} $</td>
        <td style="text-align: right">${item.montant.toFixed(2)} $</td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Facture ${data.numero}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .title { font-size: 28px; font-weight: bold; color: #2563eb; }
    .invoice-info { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #2563eb; color: white; padding: 12px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
    .totals { margin-top: 30px; }
    .totals table { width: 300px; margin-left: auto; }
    .total-row { font-weight: bold; font-size: 18px; background: #eff6ff; }
    .payment-info { margin-top: 40px; padding: 20px; background: #fef3c7; border-radius: 8px; }
    .footer { margin-top: 60px; text-align: center; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">FACTURE</div>
    ${data.company_info ? `
    <div>
      <strong>${data.company_info.name}</strong><br>
      ${data.company_info.address}<br>
      ${data.company_info.phone}<br>
      ${data.company_info.email}<br>
      ${data.company_info.neq ? `NEQ: ${data.company_info.neq}` : ''}
    </div>
    ` : ''}
  </div>

  <div class="invoice-info">
    <div style="display: flex; justify-content: space-between;">
      <div>
        <strong>Facturé à:</strong><br>
        ${data.client_name}<br>
        ${data.client_address || ''}
      </div>
      <div style="text-align: right;">
        <p><strong>Facture N°:</strong> ${data.numero}</p>
        <p><strong>Date:</strong> ${data.date_facture}</p>
        <p><strong>Échéance:</strong> ${data.date_echeance}</p>
        ${data.project_name ? `<p><strong>Projet:</strong> ${data.project_name}</p>` : ''}
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align: center">Qté</th>
        <th style="text-align: center">Unité</th>
        <th style="text-align: right">Prix unit.</th>
        <th style="text-align: right">Montant</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML}
    </tbody>
  </table>

  <div class="totals">
    <table>
      <tr><td>Sous-total:</td><td style="text-align: right">${data.montant_ht.toFixed(2)} $</td></tr>
      <tr><td>TPS (5%):</td><td style="text-align: right">${data.tps.toFixed(2)} $</td></tr>
      <tr><td>TVQ (9.975%):</td><td style="text-align: right">${data.tvq.toFixed(2)} $</td></tr>
      <tr class="total-row"><td>TOTAL DÛ:</td><td style="text-align: right">${data.montant_total.toFixed(2)} $</td></tr>
    </table>
  </div>

  ${data.payment_info ? `
  <div class="payment-info">
    <strong>Informations de paiement:</strong><br>
    ${data.payment_info.bank_name ? `Banque: ${data.payment_info.bank_name}<br>` : ''}
    ${data.payment_info.transit ? `Transit: ${data.payment_info.transit}<br>` : ''}
    ${data.payment_info.account ? `Compte: ${data.payment_info.account}` : ''}
  </div>
  ` : ''}

  <div class="footer">
    <p>Merci de votre confiance!</p>
    <p>Généré par DAST Solutions</p>
  </div>
</body>
</html>
    `;
  }

  async downloadPDF(data: FacturePDFData): Promise<void> {
    const blob = await this.generatePDF(data);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facture-${data.numero}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const pdfFactureService = new PDFFactureService();

// Helper functions for direct exports
export async function generateFacturePDF(facture: FacturePDFData): Promise<Blob> {
  return pdfFactureService.generatePDF(facture);
}

export async function downloadFacturePDF(facture: FacturePDFData): Promise<void> {
  return pdfFactureService.downloadPDF(facture);
}

export async function openFacturePDFInNewTab(facture: FacturePDFData): Promise<void> {
  const blob = await pdfFactureService.generatePDF(facture);
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

export async function loadEntrepriseSettings(): Promise<FacturePDFData['company_info'] | null> {
  // Load from localStorage or return default
  const saved = localStorage.getItem('entreprise_settings');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
}

export default pdfFactureService;
