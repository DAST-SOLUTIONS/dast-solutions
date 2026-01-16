/**
 * DAST Solutions - Service PDF pour Soumissions Professionnelles
 * Génère des PDFs de haute qualité pour les soumissions
 */
import jsPDF from 'jspdf'

// Local types to ensure all required properties exist
interface SoumissionItem {
  id?: string;
  description: string;
  quantite?: number;
  quantity?: number;
  unite?: string;
  unit?: string;
  prix_unitaire?: number;
  unit_price?: number;
  total?: number;
  total_price?: number;
  is_included?: boolean;
  inclus?: boolean;
}

interface SoumissionSection {
  id?: string;
  nom?: string;
  name?: string;
  titre?: string;
  items?: SoumissionItem[];
}

interface SoumissionV2 {
  id?: string;
  numero: string;
  revision?: number;
  date_creation?: string;
  date_validite?: string;
  // Client info - support both FR and EN naming
  client_nom?: string;
  client_name?: string;
  client_adresse?: string;
  client_address?: string;
  client_telephone?: string;
  client_phone?: string;
  client_email?: string;
  // Project info
  projet_nom?: string;
  project_name?: string;
  projet_adresse?: string;
  project_address?: string;
  projet_description?: string;
  project_description?: string;
  // Sections
  sections?: SoumissionSection[];
  // Totals
  sous_total?: number;
  subtotal?: number;
  rabais_montant?: number;
  discount_amount?: number;
  rabais_pourcent?: number;
  discount_percent?: number;
  contingence_montant?: number;
  contingency_amount?: number;
  contingence_pourcent?: number;
  contingency_percent?: number;
  profit_montant?: number;
  profit_amount?: number;
  profit_pourcent?: number;
  profit_percent?: number;
  tps?: number;
  tps_amount?: number;
  tvq?: number;
  tvq_amount?: number;
  total?: number;
  grand_total?: number;
  // Additional
  conditions?: string;
  terms_conditions?: string;
  notes?: string;
  notes_internes?: string;
  prepare_par?: string;
  prepared_by?: string;
  prepare_par_titre?: string;
  prepared_by_title?: string;
}

interface CompanyInfo {
  name: string
  address: string
  city: string
  phone: string
  email: string
  website?: string
  rbq?: string
  logo?: string
}

const DEFAULT_COMPANY: CompanyInfo = {
  name: 'DAST Solutions',
  address: '123 rue de la Construction',
  city: 'Montréal, QC H2X 1Y4',
  phone: '(514) 555-1234',
  email: 'info@dastsolutions.ca',
  website: 'www.dastsolutions.ca',
  rbq: '1234-5678-90'
}

const COLORS = {
  primary: [13, 148, 136] as [number, number, number],     // Teal-600
  secondary: [107, 114, 128] as [number, number, number],  // Gray-500
  dark: [17, 24, 39] as [number, number, number],          // Gray-900
  light: [249, 250, 251] as [number, number, number],      // Gray-50
  white: [255, 255, 255] as [number, number, number],
  border: [229, 231, 235] as [number, number, number],     // Gray-200
}

// Helper functions to get values with fallbacks
const getClientName = (s: SoumissionV2) => s.client_name || s.client_nom || '-';
const getClientAddress = (s: SoumissionV2) => s.client_address || s.client_adresse || '';
const getClientPhone = (s: SoumissionV2) => s.client_phone || s.client_telephone || '';
const getProjectName = (s: SoumissionV2) => s.project_name || s.projet_nom || '-';
const getProjectAddress = (s: SoumissionV2) => s.project_address || s.projet_adresse || '';
const getProjectDescription = (s: SoumissionV2) => s.project_description || s.projet_description || '';
const getDateValidite = (s: SoumissionV2) => s.date_validite || '';
const getSubtotal = (s: SoumissionV2) => s.subtotal || s.sous_total || 0;
const getDiscountAmount = (s: SoumissionV2) => s.discount_amount || s.rabais_montant || 0;
const getDiscountPercent = (s: SoumissionV2) => s.discount_percent || s.rabais_pourcent || 0;
const getContingencyAmount = (s: SoumissionV2) => s.contingency_amount || s.contingence_montant || 0;
const getContingencyPercent = (s: SoumissionV2) => s.contingency_percent || s.contingence_pourcent || 0;
const getProfitAmount = (s: SoumissionV2) => s.profit_amount || s.profit_montant || 0;
const getProfitPercent = (s: SoumissionV2) => s.profit_percent || s.profit_pourcent || 0;
const getTpsAmount = (s: SoumissionV2) => s.tps_amount || s.tps || 0;
const getTvqAmount = (s: SoumissionV2) => s.tvq_amount || s.tvq || 0;
const getGrandTotal = (s: SoumissionV2) => s.grand_total || s.total || 0;
const getTermsConditions = (s: SoumissionV2) => s.terms_conditions || s.conditions || '';
const getNotes = (s: SoumissionV2) => s.notes || s.notes_internes || '';
const getPreparedBy = (s: SoumissionV2) => s.prepared_by || s.prepare_par || '';
const getPreparedByTitle = (s: SoumissionV2) => s.prepared_by_title || s.prepare_par_titre || '';
const getRevision = (s: SoumissionV2) => s.revision || 1;

// Section helpers
const getSectionName = (section: SoumissionSection) => section.name || section.nom || section.titre || 'Section';

// Item helpers
const getItemQuantity = (item: SoumissionItem) => item.quantity || item.quantite || 0;
const getItemUnit = (item: SoumissionItem) => item.unit || item.unite || '';
const getItemUnitPrice = (item: SoumissionItem) => item.unit_price || item.prix_unitaire || 0;
const getItemTotalPrice = (item: SoumissionItem) => item.total_price || item.total || 0;
const getItemIsIncluded = (item: SoumissionItem) => item.is_included !== undefined ? item.is_included : (item.inclus !== undefined ? item.inclus : true);

export async function generateSoumissionPDF(
  soumission: SoumissionV2,
  company: CompanyInfo = DEFAULT_COMPANY
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)
  let y = margin

  // Helper functions
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(amount)

  const addText = (text: string, x: number, yPos: number, options: any = {}) => {
    const { 
      fontSize = 10, 
      fontStyle = 'normal', 
      color = COLORS.dark,
      align = 'left',
      maxWidth
    } = options
    
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', fontStyle)
    doc.setTextColor(color[0], color[1], color[2])
    
    if (maxWidth) {
      doc.text(text, x, yPos, { maxWidth, align })
    } else {
      doc.text(text, x, yPos, { align })
    }
  }

  const addLine = (x1: number, y1: number, x2: number, y2: number, color = COLORS.border) => {
    doc.setDrawColor(...color)
    doc.setLineWidth(0.3)
    doc.line(x1, y1, x2, y2)
  }

  const addRect = (x: number, yPos: number, w: number, h: number, color: [number, number, number], filled = true) => {
    if (filled) {
      doc.setFillColor(...color)
      doc.rect(x, yPos, w, h, 'F')
    } else {
      doc.setDrawColor(...color)
      doc.rect(x, yPos, w, h, 'S')
    }
  }

  const checkPageBreak = (neededSpace: number) => {
    if (y + neededSpace > pageHeight - 30) {
      doc.addPage()
      y = margin
      return true
    }
    return false
  }

  // ============================================
  // HEADER
  // ============================================
  
  // Company header background
  addRect(0, 0, pageWidth, 45, COLORS.primary)
  
  // Company name
  addText(company.name.toUpperCase(), margin, 18, {
    fontSize: 22,
    fontStyle: 'bold',
    color: COLORS.white
  })
  
  // Company details
  addText(`${company.address} | ${company.city}`, margin, 26, {
    fontSize: 9,
    color: COLORS.white
  })
  addText(`Tél: ${company.phone} | ${company.email}`, margin, 32, {
    fontSize: 9,
    color: COLORS.white
  })
  if (company.rbq) {
    addText(`RBQ: ${company.rbq}`, margin, 38, {
      fontSize: 9,
      color: COLORS.white
    })
  }

  // Soumission number (right side)
  addText('SOUMISSION', pageWidth - margin, 18, {
    fontSize: 14,
    fontStyle: 'bold',
    color: COLORS.white,
    align: 'right'
  })
  addText(soumission.numero, pageWidth - margin, 26, {
    fontSize: 18,
    fontStyle: 'bold',
    color: COLORS.white,
    align: 'right'
  })
  if (getRevision(soumission) > 1) {
    addText(`Révision ${getRevision(soumission)}`, pageWidth - margin, 34, {
      fontSize: 10,
      color: COLORS.white,
      align: 'right'
    })
  }

  y = 55

  // ============================================
  // CLIENT & PROJECT INFO
  // ============================================
  
  // Two column layout
  const colWidth = (contentWidth - 10) / 2
  
  // Client box
  addRect(margin, y, colWidth, 40, COLORS.light)
  addText('CLIENT', margin + 5, y + 8, {
    fontSize: 8,
    fontStyle: 'bold',
    color: COLORS.secondary
  })
  addText(getClientName(soumission), margin + 5, y + 16, {
    fontSize: 11,
    fontStyle: 'bold',
    color: COLORS.dark
  })
  const clientAddr = getClientAddress(soumission);
  if (clientAddr) {
    const addressLines = clientAddr.split('\n')
    addressLines.forEach((line, i) => {
      addText(line, margin + 5, y + 23 + (i * 5), {
        fontSize: 9,
        color: COLORS.secondary
      })
    })
  }
  const clientTel = getClientPhone(soumission);
  if (clientTel) {
    addText(clientTel, margin + 5, y + 36, {
      fontSize: 9,
      color: COLORS.secondary
    })
  }

  // Project box
  addRect(margin + colWidth + 10, y, colWidth, 40, COLORS.light)
  addText('PROJET', margin + colWidth + 15, y + 8, {
    fontSize: 8,
    fontStyle: 'bold',
    color: COLORS.secondary
  })
  addText(getProjectName(soumission), margin + colWidth + 15, y + 16, {
    fontSize: 11,
    fontStyle: 'bold',
    color: COLORS.dark
  })
  const projectAddr = getProjectAddress(soumission);
  if (projectAddr) {
    const addressLines = projectAddr.split('\n')
    addressLines.forEach((line, i) => {
      addText(line, margin + colWidth + 15, y + 23 + (i * 5), {
        fontSize: 9,
        color: COLORS.secondary
      })
    })
  }

  y += 48

  // Dates row
  addText(`Date: ${soumission.date_creation || '-'}`, margin, y, {
    fontSize: 9,
    color: COLORS.secondary
  })
  addText(`Valide jusqu'au: ${getDateValidite(soumission) || '-'}`, margin + 60, y, {
    fontSize: 9,
    color: COLORS.secondary
  })

  y += 10

  // Description
  const projectDesc = getProjectDescription(soumission);
  if (projectDesc) {
    addText('Description des travaux:', margin, y, {
      fontSize: 9,
      fontStyle: 'bold',
      color: COLORS.dark
    })
    y += 5
    const descLines = doc.splitTextToSize(projectDesc, contentWidth)
    addText(descLines.join('\n'), margin, y, {
      fontSize: 9,
      color: COLORS.secondary,
      maxWidth: contentWidth
    })
    y += descLines.length * 4 + 5
  }

  y += 5
  addLine(margin, y, pageWidth - margin, y, COLORS.border)
  y += 8

  // ============================================
  // ITEMS TABLE
  // ============================================
  
  // Table header
  const cols = {
    desc: { x: margin, w: contentWidth * 0.45 },
    qty: { x: margin + contentWidth * 0.45, w: contentWidth * 0.12 },
    unit: { x: margin + contentWidth * 0.57, w: contentWidth * 0.10 },
    price: { x: margin + contentWidth * 0.67, w: contentWidth * 0.15 },
    total: { x: margin + contentWidth * 0.82, w: contentWidth * 0.18 }
  }

  const drawTableHeader = () => {
    addRect(margin, y, contentWidth, 8, COLORS.primary)
    addText('DESCRIPTION', cols.desc.x + 2, y + 5.5, {
      fontSize: 8,
      fontStyle: 'bold',
      color: COLORS.white
    })
    addText('QTÉ', cols.qty.x + 2, y + 5.5, {
      fontSize: 8,
      fontStyle: 'bold',
      color: COLORS.white,
      align: 'right'
    })
    addText('UNITÉ', cols.unit.x + 2, y + 5.5, {
      fontSize: 8,
      fontStyle: 'bold',
      color: COLORS.white
    })
    addText('PRIX UNIT.', cols.price.x + cols.price.w - 2, y + 5.5, {
      fontSize: 8,
      fontStyle: 'bold',
      color: COLORS.white,
      align: 'right'
    })
    addText('TOTAL', cols.total.x + cols.total.w - 2, y + 5.5, {
      fontSize: 8,
      fontStyle: 'bold',
      color: COLORS.white,
      align: 'right'
    })
    y += 10
  }

  drawTableHeader()

  // Sections and items
  soumission.sections?.forEach((section, sectionIndex) => {
    checkPageBreak(15)

    // Section header
    addRect(margin, y, contentWidth, 7, COLORS.light)
    addText(getSectionName(section).toUpperCase(), margin + 3, y + 5, {
      fontSize: 9,
      fontStyle: 'bold',
      color: COLORS.dark
    })
    y += 9

    // Items
    section.items?.forEach((item, itemIndex) => {
      if (!getItemIsIncluded(item)) return
      
      checkPageBreak(10)

      // Alternating row background
      if (itemIndex % 2 === 0) {
        addRect(margin, y, contentWidth, 7, [255, 255, 255])
      }

      // Description
      const descText = doc.splitTextToSize(item.description, cols.desc.w - 4)
      addText(descText[0], cols.desc.x + 2, y + 5, {
        fontSize: 9,
        color: COLORS.dark
      })

      // Quantity
      const qty = getItemQuantity(item);
      if (qty) {
        addText(qty.toString(), cols.qty.x + cols.qty.w - 2, y + 5, {
          fontSize: 9,
          color: COLORS.dark,
          align: 'right'
        })
      }

      // Unit
      const unit = getItemUnit(item);
      if (unit) {
        addText(unit, cols.unit.x + 2, y + 5, {
          fontSize: 9,
          color: COLORS.dark
        })
      }

      // Unit price
      const unitPrice = getItemUnitPrice(item);
      if (unitPrice) {
        addText(formatCurrency(unitPrice), cols.price.x + cols.price.w - 2, y + 5, {
          fontSize: 9,
          color: COLORS.dark,
          align: 'right'
        })
      }

      // Total
      addText(formatCurrency(getItemTotalPrice(item)), cols.total.x + cols.total.w - 2, y + 5, {
        fontSize: 9,
        fontStyle: 'bold',
        color: COLORS.dark,
        align: 'right'
      })

      y += 7

      // Additional lines for long descriptions
      if (descText.length > 1) {
        descText.slice(1).forEach(line => {
          addText(line, cols.desc.x + 2, y + 3, {
            fontSize: 9,
            color: COLORS.secondary
          })
          y += 5
        })
      }
    })

    // Section subtotal
    const sectionTotal = section.items
      ?.filter(i => getItemIsIncluded(i))
      .reduce((sum, item) => sum + getItemTotalPrice(item), 0) || 0
    
    addLine(cols.total.x, y, cols.total.x + cols.total.w, y, COLORS.secondary)
    y += 1
    addText(`Sous-total ${getSectionName(section)}:`, cols.price.x, y + 4, {
      fontSize: 8,
      color: COLORS.secondary,
      align: 'right'
    })
    addText(formatCurrency(sectionTotal), cols.total.x + cols.total.w - 2, y + 4, {
      fontSize: 9,
      fontStyle: 'bold',
      color: COLORS.dark,
      align: 'right'
    })
    y += 8
  })

  // ============================================
  // TOTALS
  // ============================================
  
  checkPageBreak(50)
  y += 5
  addLine(margin, y, pageWidth - margin, y, COLORS.primary)
  y += 8

  const totalsX = pageWidth - margin - 80
  const totalsValueX = pageWidth - margin

  // Subtotal
  addText('Sous-total:', totalsX, y, {
    fontSize: 10,
    color: COLORS.secondary,
    align: 'right'
  })
  addText(formatCurrency(getSubtotal(soumission)), totalsValueX, y, {
    fontSize: 10,
    fontStyle: 'bold',
    color: COLORS.dark,
    align: 'right'
  })
  y += 6

  // Discount
  const discountAmt = getDiscountAmount(soumission);
  if (discountAmt > 0) {
    addText(`Rabais (${getDiscountPercent(soumission)}%):`, totalsX, y, {
      fontSize: 9,
      color: COLORS.secondary,
      align: 'right'
    })
    addText(`-${formatCurrency(discountAmt)}`, totalsValueX, y, {
      fontSize: 9,
      color: [220, 38, 38],
      align: 'right'
    })
    y += 5
  }

  // Contingency
  const contingencyAmt = getContingencyAmount(soumission);
  if (contingencyAmt > 0) {
    addText(`Contingence (${getContingencyPercent(soumission)}%):`, totalsX, y, {
      fontSize: 9,
      color: COLORS.secondary,
      align: 'right'
    })
    addText(formatCurrency(contingencyAmt), totalsValueX, y, {
      fontSize: 9,
      color: COLORS.dark,
      align: 'right'
    })
    y += 5
  }

  // Profit
  const profitAmt = getProfitAmount(soumission);
  if (profitAmt > 0) {
    addText(`Profit (${getProfitPercent(soumission)}%):`, totalsX, y, {
      fontSize: 9,
      color: COLORS.secondary,
      align: 'right'
    })
    addText(formatCurrency(profitAmt), totalsValueX, y, {
      fontSize: 9,
      color: COLORS.dark,
      align: 'right'
    })
    y += 5
  }

  y += 2

  // Taxes
  addText('TPS (5%):', totalsX, y, {
    fontSize: 9,
    color: COLORS.secondary,
    align: 'right'
  })
  addText(formatCurrency(getTpsAmount(soumission)), totalsValueX, y, {
    fontSize: 9,
    color: COLORS.dark,
    align: 'right'
  })
  y += 5

  addText('TVQ (9.975%):', totalsX, y, {
    fontSize: 9,
    color: COLORS.secondary,
    align: 'right'
  })
  addText(formatCurrency(getTvqAmount(soumission)), totalsValueX, y, {
    fontSize: 9,
    color: COLORS.dark,
    align: 'right'
  })
  y += 8

  // Grand Total
  addRect(totalsX - 30, y - 2, 110, 12, COLORS.primary)
  addText('TOTAL:', totalsX, y + 6, {
    fontSize: 12,
    fontStyle: 'bold',
    color: COLORS.white,
    align: 'right'
  })
  addText(formatCurrency(getGrandTotal(soumission)), totalsValueX, y + 6, {
    fontSize: 14,
    fontStyle: 'bold',
    color: COLORS.white,
    align: 'right'
  })
  y += 20

  // ============================================
  // TERMS & CONDITIONS
  // ============================================
  
  checkPageBreak(40)
  
  const termsConditions = getTermsConditions(soumission);
  if (termsConditions) {
    addText('CONDITIONS:', margin, y, {
      fontSize: 9,
      fontStyle: 'bold',
      color: COLORS.dark
    })
    y += 5

    const termsLines = doc.splitTextToSize(termsConditions, contentWidth)
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.secondary)
    termsLines.forEach(line => {
      checkPageBreak(4)
      doc.text(line, margin, y)
      y += 4
    })
    y += 5
  }

  // Notes
  const notes = getNotes(soumission);
  if (notes) {
    checkPageBreak(20)
    addText('NOTES:', margin, y, {
      fontSize: 9,
      fontStyle: 'bold',
      color: COLORS.dark
    })
    y += 5
    const notesLines = doc.splitTextToSize(notes, contentWidth)
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.secondary)
    notesLines.forEach(line => {
      checkPageBreak(4)
      doc.text(line, margin, y)
      y += 4
    })
    y += 10
  }

  // ============================================
  // SIGNATURES
  // ============================================
  
  checkPageBreak(45)
  y += 5
  addLine(margin, y, pageWidth - margin, y, COLORS.border)
  y += 15

  const sigWidth = (contentWidth - 20) / 2

  // Prepared by
  addText('Préparé par:', margin, y, {
    fontSize: 8,
    color: COLORS.secondary
  })
  y += 15
  addLine(margin, y, margin + sigWidth, y, COLORS.dark)
  y += 4
  addText(getPreparedBy(soumission) || company.name, margin, y, {
    fontSize: 10,
    fontStyle: 'bold',
    color: COLORS.dark
  })
  const preparedByTitle = getPreparedByTitle(soumission);
  if (preparedByTitle) {
    y += 4
    addText(preparedByTitle, margin, y, {
      fontSize: 8,
      color: COLORS.secondary
    })
  }

  // Accepted by
  y -= (preparedByTitle ? 23 : 19)
  addText('Accepté par:', margin + sigWidth + 20, y, {
    fontSize: 8,
    color: COLORS.secondary
  })
  y += 15
  addLine(margin + sigWidth + 20, y, pageWidth - margin, y, COLORS.dark)
  y += 4
  addText(getClientName(soumission), margin + sigWidth + 20, y, {
    fontSize: 10,
    fontStyle: 'bold',
    color: COLORS.dark
  })
  y += 5
  addText('Date: _______________________', margin + sigWidth + 20, y, {
    fontSize: 8,
    color: COLORS.secondary
  })

  // ============================================
  // FOOTER
  // ============================================
  
  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setPage(pageNum)
    const footerY = pageHeight - 10
    
    addLine(margin, footerY - 5, pageWidth - margin, footerY - 5, COLORS.border)
    
    addText(`${company.name} | ${company.phone} | ${company.email}`, margin, footerY, {
      fontSize: 7,
      color: COLORS.secondary
    })
    
    addText(`Page ${pageNum} / ${totalPages}`, pageWidth - margin, footerY, {
      fontSize: 7,
      color: COLORS.secondary,
      align: 'right'
    })
  }

  // Add footers to all pages
  const totalPages = (doc as any).internal.getNumberOfPages ? (doc as any).internal.getNumberOfPages() : doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    addFooter(i, totalPages)
  }

  return doc.output('blob')
}

// Helper to download PDF
export async function downloadSoumissionPDF(soumission: SoumissionV2, filename?: string) {
  const blob = await generateSoumissionPDF(soumission)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `Soumission_${soumission.numero}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Helper to open PDF in new tab
export async function openSoumissionPDF(soumission: SoumissionV2) {
  const blob = await generateSoumissionPDF(soumission)
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}

// Export types for use in other files
export type { SoumissionV2, SoumissionSection, SoumissionItem, CompanyInfo }
