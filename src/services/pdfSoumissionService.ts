/**
 * Service PDF Soumission - Génération de PDF pour les soumissions
 */

export interface SoumissionPDFData {
  id: string;
  numero: string;
  titre: string;
  date_creation: string;
  date_expiration?: string;
  client_name?: string;
  client_address?: string;
  project_name?: string;
  project_address?: string;
  items: Array<{
    description: string;
    quantite: number;
    unite: string;
    prix_unitaire: number;
    montant: number;
    categorie?: string;
  }>;
  montant_ht: number;
  tps: number;
  tvq: number;
  montant_total: number;
  notes?: string;
  conditions?: string;
  company_info?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    rbq_license?: string;
  };
}

class PDFSoumissionService {
  async generatePDF(data: SoumissionPDFData): Promise<Blob> {
    // Generate PDF content as HTML first
    const html = this.generateHTML(data);
    
    // In a real implementation, this would use a library like jsPDF or call a server-side PDF generator
    // For now, return a simple blob
    const blob = new Blob([html], { type: 'text/html' });
    return blob;
  }

  private generateHTML(data: SoumissionPDFData): string {
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
  <title>Soumission ${data.numero}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .company-info { text-align: right; }
    .title { font-size: 24px; font-weight: bold; color: #0d9488; margin-bottom: 20px; }
    .info-section { margin-bottom: 30px; }
    .info-section h3 { color: #0d9488; border-bottom: 2px solid #0d9488; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #0d9488; color: white; padding: 10px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #ddd; }
    .totals { margin-top: 30px; text-align: right; }
    .totals table { width: 300px; margin-left: auto; }
    .total-row { font-weight: bold; font-size: 18px; background: #f0fdfa; }
    .notes { margin-top: 40px; padding: 20px; background: #f9fafb; border-radius: 8px; }
    .footer { margin-top: 60px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">SOUMISSION</div>
      <p><strong>Numéro:</strong> ${data.numero}</p>
      <p><strong>Date:</strong> ${data.date_creation}</p>
      ${data.date_expiration ? `<p><strong>Valide jusqu'au:</strong> ${data.date_expiration}</p>` : ''}
    </div>
    ${data.company_info ? `
    <div class="company-info">
      <strong>${data.company_info.name}</strong><br>
      ${data.company_info.address}<br>
      ${data.company_info.phone}<br>
      ${data.company_info.email}<br>
      ${data.company_info.rbq_license ? `RBQ: ${data.company_info.rbq_license}` : ''}
    </div>
    ` : ''}
  </div>

  <div class="info-section">
    <h3>Client</h3>
    <p><strong>${data.client_name || 'N/A'}</strong></p>
    ${data.client_address ? `<p>${data.client_address}</p>` : ''}
  </div>

  <div class="info-section">
    <h3>Projet</h3>
    <p><strong>${data.project_name || data.titre}</strong></p>
    ${data.project_address ? `<p>${data.project_address}</p>` : ''}
  </div>

  <div class="info-section">
    <h3>Détail des travaux</h3>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: center">Quantité</th>
          <th style="text-align: center">Unité</th>
          <th style="text-align: right">Prix unitaire</th>
          <th style="text-align: right">Montant</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>
  </div>

  <div class="totals">
    <table>
      <tr>
        <td>Sous-total HT:</td>
        <td style="text-align: right">${data.montant_ht.toFixed(2)} $</td>
      </tr>
      <tr>
        <td>TPS (5%):</td>
        <td style="text-align: right">${data.tps.toFixed(2)} $</td>
      </tr>
      <tr>
        <td>TVQ (9.975%):</td>
        <td style="text-align: right">${data.tvq.toFixed(2)} $</td>
      </tr>
      <tr class="total-row">
        <td>TOTAL:</td>
        <td style="text-align: right">${data.montant_total.toFixed(2)} $</td>
      </tr>
    </table>
  </div>

  ${data.notes ? `
  <div class="notes">
    <h4>Notes et conditions</h4>
    <p>${data.notes}</p>
  </div>
  ` : ''}

  <div class="footer">
    <p>Cette soumission est valide pour 30 jours à compter de la date d'émission.</p>
    <p>Généré par DAST Solutions</p>
  </div>
</body>
</html>
    `;
  }

  async downloadPDF(data: SoumissionPDFData, filename?: string): Promise<void> {
    const blob = await this.generatePDF(data);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `soumission-${data.numero}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const pdfSoumissionService = new PDFSoumissionService();
export default pdfSoumissionService;
