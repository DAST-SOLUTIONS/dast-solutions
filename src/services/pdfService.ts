/**
 * DAST Solutions - Service Export PDF Soumissions
 * Génère des soumissions PDF professionnelles
 */
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export interface SoumissionPDFData {
  // En-tête entreprise
  entreprise: {
    nom: string
    adresse: string
    ville: string
    province: string
    codePostal: string
    telephone: string
    email: string
    site?: string
    rbqLicence?: string
    neq?: string
    logo?: string // Base64
  }
  
  // Soumission
  numero: string
  revision?: number
  dateCreation: string
  dateValidite: string
  
  // Client
  client: {
    nom: string
    entreprise?: string
    adresse?: string
    ville?: string
    province?: string
    codePostal?: string
    telephone?: string
    email?: string
  }
  
  // Projet
  projet: {
    nom: string
    adresse?: string
    description?: string
  }
  
  // Items
  items: Array<{
    description: string
    categorie?: string
    quantite: number
    unite: string
    prixUnitaire: number
    total: number
  }>
  
  // Totaux
  sousTotal: number
  tps: number
  tvq: number
  total: number
  
  // Conditions
  conditions?: string
  exclusions?: string
  notes?: string
}

// Couleurs DAST
const COLORS = {
  primary: [20, 184, 166] as [number, number, number], // Teal-500
  secondary: [31, 41, 55] as [number, number, number], // Gray-800
  light: [243, 244, 246] as [number, number, number], // Gray-100
  text: [55, 65, 81] as [number, number, number], // Gray-700
  accent: [16, 185, 129] as [number, number, number], // Emerald-500
}

export async function generateSoumissionPDF(data: SoumissionPDFData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  })
  
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  let y = margin

  // === EN-TÊTE ===
  
  // Logo ou nom entreprise
  if (data.entreprise.logo) {
    try {
      doc.addImage(data.entreprise.logo, 'PNG', margin, y, 40, 15)
    } catch {
      doc.setFontSize(20)
      doc.setTextColor(...COLORS.primary)
      doc.setFont('helvetica', 'bold')
      doc.text(data.entreprise.nom, margin, y + 10)
    }
  } else {
    doc.setFontSize(20)
    doc.setTextColor(...COLORS.primary)
    doc.setFont('helvetica', 'bold')
    doc.text(data.entreprise.nom, margin, y + 10)
  }
  
  // Infos entreprise (droite)
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.text)
  doc.setFont('helvetica', 'normal')
  const rightX = pageWidth - margin
  doc.text(data.entreprise.adresse, rightX, y + 3, { align: 'right' })
  doc.text(`${data.entreprise.ville}, ${data.entreprise.province} ${data.entreprise.codePostal}`, rightX, y + 7, { align: 'right' })
  doc.text(data.entreprise.telephone, rightX, y + 11, { align: 'right' })
  doc.text(data.entreprise.email, rightX, y + 15, { align: 'right' })
  if (data.entreprise.rbqLicence) {
    doc.text(`RBQ: ${data.entreprise.rbqLicence}`, rightX, y + 19, { align: 'right' })
  }
  
  y += 30
  
  // Ligne séparatrice
  doc.setDrawColor(...COLORS.primary)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  
  y += 10

  // === TITRE SOUMISSION ===
  doc.setFontSize(24)
  doc.setTextColor(...COLORS.secondary)
  doc.setFont('helvetica', 'bold')
  doc.text('SOUMISSION', margin, y)
  
  // Numéro et date
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`N° ${data.numero}${data.revision && data.revision > 1 ? ` (Rév. ${data.revision})` : ''}`, rightX, y - 5, { align: 'right' })
  doc.setFontSize(9)
  doc.text(`Date: ${format(new Date(data.dateCreation), 'dd MMMM yyyy', { locale: fr })}`, rightX, y, { align: 'right' })
  doc.text(`Valide jusqu'au: ${format(new Date(data.dateValidite), 'dd MMMM yyyy', { locale: fr })}`, rightX, y + 5, { align: 'right' })
  
  y += 15

  // === CLIENT & PROJET (2 colonnes) ===
  const colWidth = (pageWidth - margin * 3) / 2
  
  // Client (gauche)
  doc.setFillColor(...COLORS.light)
  doc.roundedRect(margin, y, colWidth, 35, 2, 2, 'F')
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.primary)
  doc.text('CLIENT', margin + 5, y + 7)
  
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.text)
  doc.setFontSize(9)
  let clientY = y + 13
  doc.text(data.client.nom, margin + 5, clientY)
  if (data.client.entreprise) {
    clientY += 4
    doc.text(data.client.entreprise, margin + 5, clientY)
  }
  if (data.client.adresse) {
    clientY += 4
    doc.text(data.client.adresse, margin + 5, clientY)
  }
  if (data.client.ville) {
    clientY += 4
    doc.text(`${data.client.ville}, ${data.client.province || 'QC'} ${data.client.codePostal || ''}`, margin + 5, clientY)
  }
  if (data.client.telephone) {
    clientY += 4
    doc.text(`Tél: ${data.client.telephone}`, margin + 5, clientY)
  }
  
  // Projet (droite)
  doc.setFillColor(...COLORS.light)
  doc.roundedRect(margin * 2 + colWidth, y, colWidth, 35, 2, 2, 'F')
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.primary)
  doc.text('PROJET', margin * 2 + colWidth + 5, y + 7)
  
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.text)
  doc.setFontSize(9)
  let projetY = y + 13
  doc.text(data.projet.nom, margin * 2 + colWidth + 5, projetY)
  if (data.projet.adresse) {
    projetY += 4
    const adresseLines = doc.splitTextToSize(data.projet.adresse, colWidth - 10)
    doc.text(adresseLines, margin * 2 + colWidth + 5, projetY)
    projetY += (adresseLines.length - 1) * 4
  }
  if (data.projet.description) {
    projetY += 4
    const descLines = doc.splitTextToSize(data.projet.description, colWidth - 10)
    doc.text(descLines.slice(0, 3), margin * 2 + colWidth + 5, projetY)
  }
  
  y += 45

  // === TABLEAU DES ITEMS ===
  const tableData = data.items.map(item => [
    item.description,
    item.quantite.toLocaleString('fr-CA', { minimumFractionDigits: 2 }),
    item.unite,
    item.prixUnitaire.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' }),
    item.total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })
  ])

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Qté', 'Unité', 'Prix unit.', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8,
      textColor: COLORS.text
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 20, halign: 'right' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' }
    },
    margin: { left: margin, right: margin },
    didDrawPage: (data) => {
      // Pied de page sur chaque page
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text(
        `Page ${data.pageNumber}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      )
    }
  })

  // @ts-ignore
  y = doc.lastAutoTable.finalY + 10

  // === TOTAUX ===
  const totalsX = pageWidth - margin - 70
  const totalsWidth = 70
  
  doc.setFillColor(...COLORS.light)
  doc.roundedRect(totalsX, y, totalsWidth, 32, 2, 2, 'F')
  
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.text)
  
  // Sous-total
  doc.text('Sous-total:', totalsX + 5, y + 7)
  doc.text(data.sousTotal.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' }), totalsX + totalsWidth - 5, y + 7, { align: 'right' })
  
  // TPS
  doc.text('TPS (5%):', totalsX + 5, y + 13)
  doc.text(data.tps.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' }), totalsX + totalsWidth - 5, y + 13, { align: 'right' })
  
  // TVQ
  doc.text('TVQ (9.975%):', totalsX + 5, y + 19)
  doc.text(data.tvq.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' }), totalsX + totalsWidth - 5, y + 19, { align: 'right' })
  
  // Total
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...COLORS.primary)
  doc.text('TOTAL:', totalsX + 5, y + 28)
  doc.text(data.total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' }), totalsX + totalsWidth - 5, y + 28, { align: 'right' })
  
  y += 40

  // === CONDITIONS & EXCLUSIONS ===
  if (y > pageHeight - 80) {
    doc.addPage()
    y = margin
  }

  if (data.conditions) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.secondary)
    doc.text('CONDITIONS', margin, y)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.text)
    y += 5
    const conditionsLines = doc.splitTextToSize(data.conditions, pageWidth - margin * 2)
    doc.text(conditionsLines, margin, y)
    y += conditionsLines.length * 3.5 + 8
  }

  if (data.exclusions) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.secondary)
    doc.text('EXCLUSIONS', margin, y)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.text)
    y += 5
    const exclusionsLines = doc.splitTextToSize(data.exclusions, pageWidth - margin * 2)
    doc.text(exclusionsLines, margin, y)
    y += exclusionsLines.length * 3.5 + 8
  }

  // === SIGNATURE ===
  if (y > pageHeight - 50) {
    doc.addPage()
    y = margin
  }

  y = pageHeight - 45

  doc.setDrawColor(...COLORS.text)
  doc.setLineWidth(0.3)
  
  // Signature client
  doc.line(margin, y + 15, margin + 70, y + 15)
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.text)
  doc.text('Signature du client', margin, y + 20)
  doc.text('Date: _______________', margin, y + 25)
  
  // Signature entrepreneur
  doc.line(pageWidth - margin - 70, y + 15, pageWidth - margin, y + 15)
  doc.text('Signature autorisée', pageWidth - margin - 70, y + 20)
  doc.text(data.entreprise.nom, pageWidth - margin - 70, y + 25)

  // Pied de page final
  doc.setFontSize(7)
  doc.setTextColor(150)
  doc.text(
    `Généré par DAST Solutions - ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
    pageWidth / 2,
    pageHeight - 5,
    { align: 'center' }
  )

  return doc.output('blob')
}

/**
 * Télécharge le PDF
 */
export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Ouvre le PDF dans un nouvel onglet
 */
export function openPDFInNewTab(blob: Blob) {
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}

/**
 * Convertit une soumission Supabase en données PDF
 */
export function soumissionToPDFData(
  soumission: any,
  entreprise: SoumissionPDFData['entreprise']
): SoumissionPDFData {
  return {
    entreprise,
    numero: soumission.soumission_number,
    revision: soumission.revision,
    dateCreation: soumission.date_created,
    dateValidite: soumission.date_valid_until,
    client: {
      nom: soumission.client_name,
      entreprise: soumission.client_company,
      adresse: soumission.client_address,
      ville: soumission.client_city,
      province: soumission.client_province,
      codePostal: soumission.client_postal_code,
      telephone: soumission.client_phone,
      email: soumission.client_email
    },
    projet: {
      nom: soumission.project_name || 'Non spécifié',
      adresse: soumission.project_address,
      description: soumission.project_description
    },
    items: (soumission.items || []).map((item: any) => ({
      description: item.description,
      categorie: item.category,
      quantite: item.quantity,
      unite: item.unit,
      prixUnitaire: item.unit_price,
      total: item.total_price
    })),
    sousTotal: soumission.subtotal || 0,
    tps: soumission.tps_amount || 0,
    tvq: soumission.tvq_amount || 0,
    total: soumission.total || 0,
    conditions: soumission.conditions,
    exclusions: soumission.exclusions,
    notes: soumission.notes_internes
  }
}
