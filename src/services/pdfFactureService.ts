/**
 * DAST Solutions - Service PDF Factures
 * Génère des PDF professionnels pour les factures
 */
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'

// Types
interface FactureItem {
  description: string
  category?: string
  quantity: number
  unit: string
  unit_price: number
  total_price: number
}

interface FacturePDFData {
  // Entreprise
  entreprise: {
    nom: string
    adresse?: string
    ville?: string
    province?: string
    code_postal?: string
    telephone?: string
    email?: string
    site_web?: string
    logo?: string
    licence_rbq?: string
    neq?: string
  }
  
  // Facture
  facture_number: string
  date_facture: string
  date_echeance?: string
  
  // Client
  client: {
    name: string
    company?: string
    address?: string
    city?: string
    province?: string
    postal_code?: string
    phone?: string
    email?: string
  }
  
  // Projet
  project_name?: string
  project_address?: string
  
  // Items
  items: FactureItem[]
  
  // Totaux
  subtotal: number
  tps_amount: number
  tvq_amount: number
  total: number
  amount_paid: number
  balance_due: number
  
  // Paiements reçus
  paiements?: Array<{
    date: string
    montant: number
    methode: string
  }>
  
  // Autres
  conditions?: string
  notes?: string
  
  // Signature
  signature?: string
}

// Couleurs DAST
const COLORS = {
  primary: [13, 148, 136] as [number, number, number],    // Teal
  secondary: [75, 85, 99] as [number, number, number],    // Gray
  accent: [251, 146, 60] as [number, number, number],     // Orange
  light: [240, 253, 250] as [number, number, number],     // Teal light
  danger: [239, 68, 68] as [number, number, number]       // Red
}

/**
 * Génère un PDF de facture professionnel
 */
export function generateFacturePDF(data: FacturePDFData): Blob {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  let yPos = margin

  // ============================================
  // HEADER - Logo et infos entreprise
  // ============================================
  
  // Logo (si disponible)
  if (data.entreprise.logo) {
    try {
      doc.addImage(data.entreprise.logo, 'PNG', margin, yPos, 40, 15)
    } catch (e) {
      // Logo non disponible
    }
  }

  // Nom entreprise
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.primary)
  doc.text(data.entreprise.nom || 'DAST Solutions', data.entreprise.logo ? 60 : margin, yPos + 8)

  // Coordonnées entreprise (droite)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.secondary)
  
  const rightX = pageWidth - margin
  let rightY = yPos
  
  if (data.entreprise.adresse) {
    doc.text(data.entreprise.adresse, rightX, rightY, { align: 'right' })
    rightY += 4
  }
  if (data.entreprise.ville) {
    doc.text(`${data.entreprise.ville}, ${data.entreprise.province || 'QC'} ${data.entreprise.code_postal || ''}`, rightX, rightY, { align: 'right' })
    rightY += 4
  }
  if (data.entreprise.telephone) {
    doc.text(`Tél: ${data.entreprise.telephone}`, rightX, rightY, { align: 'right' })
    rightY += 4
  }
  if (data.entreprise.email) {
    doc.text(data.entreprise.email, rightX, rightY, { align: 'right' })
    rightY += 4
  }
  if (data.entreprise.licence_rbq) {
    doc.text(`RBQ: ${data.entreprise.licence_rbq}`, rightX, rightY, { align: 'right' })
    rightY += 4
  }
  if (data.entreprise.neq) {
    doc.text(`NEQ: ${data.entreprise.neq}`, rightX, rightY, { align: 'right' })
  }

  yPos = Math.max(yPos + 25, rightY + 5)

  // Ligne séparatrice
  doc.setDrawColor(...COLORS.primary)
  doc.setLineWidth(0.5)
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 10

  // ============================================
  // TITRE FACTURE
  // ============================================
  
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.primary)
  doc.text('FACTURE', margin, yPos)

  // Numéro et dates (droite)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text(`N° ${data.facture_number}`, rightX, yPos - 5, { align: 'right' })
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.secondary)
  doc.text(`Date: ${format(new Date(data.date_facture), 'dd MMMM yyyy', { locale: fr })}`, rightX, yPos + 2, { align: 'right' })
  
  if (data.date_echeance) {
    doc.text(`Échéance: ${format(new Date(data.date_echeance), 'dd MMMM yyyy', { locale: fr })}`, rightX, yPos + 8, { align: 'right' })
  }

  yPos += 20

  // ============================================
  // CLIENT ET PROJET
  // ============================================
  
  const boxWidth = (pageWidth - margin * 3) / 2
  
  // Box Client
  doc.setFillColor(...COLORS.light)
  doc.roundedRect(margin, yPos, boxWidth, 35, 2, 2, 'F')
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.primary)
  doc.text('FACTURER À:', margin + 5, yPos + 7)
  
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  let clientY = yPos + 14
  doc.setFontSize(11)
  doc.text(data.client.name, margin + 5, clientY)
  clientY += 5
  doc.setFontSize(9)
  if (data.client.company) {
    doc.text(data.client.company, margin + 5, clientY)
    clientY += 4
  }
  if (data.client.address) {
    doc.text(data.client.address, margin + 5, clientY)
    clientY += 4
  }
  if (data.client.city) {
    doc.text(`${data.client.city}, ${data.client.province || 'QC'} ${data.client.postal_code || ''}`, margin + 5, clientY)
  }

  // Box Projet
  const projectX = margin * 2 + boxWidth
  doc.setFillColor(245, 245, 245)
  doc.roundedRect(projectX, yPos, boxWidth, 35, 2, 2, 'F')
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.secondary)
  doc.text('PROJET:', projectX + 5, yPos + 7)
  
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(11)
  doc.text(data.project_name || '-', projectX + 5, yPos + 14)
  doc.setFontSize(9)
  if (data.project_address) {
    doc.text(data.project_address, projectX + 5, yPos + 22)
  }

  yPos += 45

  // ============================================
  // TABLEAU DES ITEMS
  // ============================================
  
  const tableData = data.items.map(item => [
    item.description + (item.category ? `\n${item.category}` : ''),
    item.quantity.toString(),
    item.unit,
    item.unit_price.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' }),
    item.total_price.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Qté', 'Unité', 'Prix unit.', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [50, 50, 50]
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' }
    },
    margin: { left: margin, right: margin }
  })

  yPos = (doc as any).lastAutoTable.finalY + 10

  // ============================================
  // TOTAUX
  // ============================================
  
  const totalsX = pageWidth - margin - 80
  const totalsWidth = 80

  // Box totaux
  doc.setFillColor(250, 250, 250)
  doc.roundedRect(totalsX - 5, yPos - 3, totalsWidth + 10, 55, 2, 2, 'F')

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.secondary)

  // Sous-total
  doc.text('Sous-total:', totalsX, yPos + 5)
  doc.text(data.subtotal.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' }), totalsX + totalsWidth, yPos + 5, { align: 'right' })

  // TPS
  doc.text('TPS (5%):', totalsX, yPos + 12)
  doc.text(data.tps_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' }), totalsX + totalsWidth, yPos + 12, { align: 'right' })

  // TVQ
  doc.text('TVQ (9.975%):', totalsX, yPos + 19)
  doc.text(data.tvq_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' }), totalsX + totalsWidth, yPos + 19, { align: 'right' })

  // Total
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.primary)
  doc.setFontSize(12)
  doc.text('Total:', totalsX, yPos + 30)
  doc.text(data.total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' }), totalsX + totalsWidth, yPos + 30, { align: 'right' })

  // Montant payé
  if (data.amount_paid > 0) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(34, 197, 94)
    doc.text('Payé:', totalsX, yPos + 40)
    doc.text(`-${data.amount_paid.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}`, totalsX + totalsWidth, yPos + 40, { align: 'right' })
  }

  // Solde dû
  if (data.balance_due > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.danger)
    doc.setFontSize(11)
    doc.text('SOLDE DÛ:', totalsX, yPos + 50)
    doc.text(data.balance_due.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' }), totalsX + totalsWidth, yPos + 50, { align: 'right' })
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(34, 197, 94)
    doc.setFontSize(11)
    doc.text('PAYÉ', totalsX + totalsWidth / 2, yPos + 50, { align: 'center' })
  }

  yPos += 65

  // ============================================
  // PAIEMENTS REÇUS
  // ============================================
  
  if (data.paiements && data.paiements.length > 0) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.secondary)
    doc.text('Paiements reçus:', margin, yPos)
    yPos += 6

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    data.paiements.forEach(p => {
      doc.text(`• ${format(new Date(p.date), 'dd/MM/yyyy')} - ${p.montant.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })} (${p.methode})`, margin + 5, yPos)
      yPos += 5
    })
    yPos += 5
  }

  // ============================================
  // CONDITIONS
  // ============================================
  
  if (data.conditions) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.secondary)
    doc.text('Conditions de paiement:', margin, yPos)
    yPos += 5
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    const conditionLines = doc.splitTextToSize(data.conditions, pageWidth - margin * 2)
    doc.text(conditionLines, margin, yPos)
    yPos += conditionLines.length * 4 + 5
  }

  // ============================================
  // SIGNATURE
  // ============================================
  
  if (data.signature) {
    // Vérifier si on a besoin d'une nouvelle page
    if (yPos > 250) {
      doc.addPage()
      yPos = margin
    }

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.secondary)
    doc.text('Signature:', margin, yPos)
    yPos += 5

    try {
      doc.addImage(data.signature, 'PNG', margin, yPos, 60, 25)
    } catch (e) {
      // Signature non valide
    }
  }

  // ============================================
  // FOOTER
  // ============================================
  
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(150, 150, 150)
  doc.text('Merci de votre confiance!', pageWidth / 2, pageHeight - 15, { align: 'center' })
  doc.text(`Généré par DAST Solutions - ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth / 2, pageHeight - 10, { align: 'center' })

  return doc.output('blob')
}

/**
 * Télécharge le PDF
 */
export function downloadFacturePDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Ouvre le PDF dans un nouvel onglet
 */
export function openFacturePDFInNewTab(blob: Blob): void {
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}

/**
 * Charge les données entreprise depuis Supabase
 */
export async function loadEntrepriseSettings(): Promise<FacturePDFData['entreprise']> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    const { data } = await supabase
      .from('user_settings')
      .select('entreprise_settings')
      .eq('user_id', user.id)
      .single()

    if (data?.entreprise_settings) {
      return data.entreprise_settings
    }
  } catch (e) {
    console.error('Erreur chargement settings:', e)
  }

  // Valeurs par défaut
  return {
    nom: 'DAST Solutions',
    telephone: '',
    email: ''
  }
}

export default { generateFacturePDF, downloadFacturePDF, openFacturePDFInNewTab, loadEntrepriseSettings }
