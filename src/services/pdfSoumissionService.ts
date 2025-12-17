/**
 * DAST Solutions - Service PDF Soumissions Professionnelles
 */
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface SoumissionPDFData {
  entreprise: { name: string; address?: string; city?: string; phone?: string; email?: string; rbq?: string }
  soumission: { number: string; date: string; validUntil: string }
  client: { name: string; company?: string; address?: string; city?: string; phone?: string; email?: string }
  project: { name: string; address?: string; description?: string }
  items: Array<{ description: string; category?: string; quantity: number; unit: string; unitPrice: number; total: number }>
  subtotal: number; tps: number; tvq: number; total: number
  conditions?: string[]; exclusions?: string[]; notes?: string
  signature?: { name: string; title?: string; date: string; image?: string }
}

export function generateSoumissionPDF(data: SoumissionPDFData): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let yPos = margin

  const primaryColor: [number, number, number] = [13, 148, 136]
  const secondaryColor: [number, number, number] = [249, 115, 22]
  const darkGray: [number, number, number] = [55, 65, 81]

  // Header bandeau
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, pageWidth, 35, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text(data.entreprise.name, margin, 22)

  // Info entreprise droite
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  let rightY = 10
  ;[data.entreprise.address, data.entreprise.city, data.entreprise.phone, data.entreprise.email, data.entreprise.rbq ? `RBQ: ${data.entreprise.rbq}` : null]
    .filter(Boolean).forEach(line => { doc.text(line!, pageWidth - margin, rightY, { align: 'right' }); rightY += 4 })

  yPos = 45

  // Titre soumission
  doc.setFillColor(245, 245, 245)
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 25, 3, 3, 'F')
  doc.setTextColor(...primaryColor)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('SOUMISSION', margin + 10, yPos + 10)
  doc.setTextColor(...darkGray)
  doc.setFontSize(14)
  doc.text(`N° ${data.soumission.number}`, margin + 10, yPos + 20)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Date: ${new Date(data.soumission.date).toLocaleDateString('fr-CA')}`, pageWidth - margin - 10, yPos + 10, { align: 'right' })
  doc.text(`Valide jusqu'au: ${new Date(data.soumission.validUntil).toLocaleDateString('fr-CA')}`, pageWidth - margin - 10, yPos + 18, { align: 'right' })

  yPos += 35
  const colWidth = (pageWidth - margin * 2 - 10) / 2

  // Client
  doc.setFillColor(...primaryColor)
  doc.rect(margin, yPos, colWidth, 6, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('CLIENT', margin + 5, yPos + 4.5)
  yPos += 8
  doc.setTextColor(...darkGray)
  doc.setFont('helvetica', 'normal')
  ;[data.client.company || data.client.name, data.client.company ? data.client.name : null, data.client.address, data.client.city, data.client.phone, data.client.email]
    .filter(Boolean).forEach(line => { doc.text(line!, margin + 5, yPos); yPos += 5 })

  // Projet
  let projectY = yPos - 30
  doc.setFillColor(...secondaryColor)
  doc.rect(margin + colWidth + 10, projectY - 8, colWidth, 6, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('PROJET', margin + colWidth + 15, projectY - 3.5)
  doc.setTextColor(...darkGray)
  doc.setFont('helvetica', 'normal')
  ;[data.project.name, data.project.address, data.project.description].filter(Boolean).forEach(line => { doc.text(line!, margin + colWidth + 15, projectY); projectY += 5 })

  yPos = Math.max(yPos, projectY) + 10

  // Tableau items
  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Catégorie', 'Qté', 'Unité', 'Prix unit.', 'Total']],
    body: data.items.map(item => [
      item.description, item.category || '', item.quantity.toString(), item.unit,
      item.unitPrice.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' }),
      item.total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })
    ]),
    theme: 'striped',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: darkGray },
    columnStyles: { 0: { cellWidth: 60 }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
    margin: { left: margin, right: margin }
  })

  yPos = (doc as any).lastAutoTable.finalY + 10

  // Totaux
  const totalsX = pageWidth - margin - 70
  doc.setFillColor(245, 245, 245)
  doc.roundedRect(totalsX - 10, yPos, 80, 45, 3, 3, 'F')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...darkGray)
  doc.text('Sous-total:', totalsX, yPos + 8)
  doc.text(data.subtotal.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' }), totalsX + 60, yPos + 8, { align: 'right' })
  doc.text('TPS (5%):', totalsX, yPos + 16)
  doc.text(data.tps.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' }), totalsX + 60, yPos + 16, { align: 'right' })
  doc.text('TVQ (9.975%):', totalsX, yPos + 24)
  doc.text(data.tvq.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' }), totalsX + 60, yPos + 24, { align: 'right' })
  doc.setDrawColor(...primaryColor)
  doc.line(totalsX, yPos + 30, totalsX + 60, yPos + 30)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...primaryColor)
  doc.text('TOTAL:', totalsX, yPos + 40)
  doc.text(data.total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' }), totalsX + 60, yPos + 40, { align: 'right' })

  yPos += 55

  // Conditions
  if (data.conditions?.length) {
    doc.setFillColor(...primaryColor)
    doc.rect(margin, yPos, pageWidth - margin * 2, 6, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('CONDITIONS', margin + 5, yPos + 4.5)
    yPos += 10
    doc.setTextColor(...darkGray)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    data.conditions.forEach(c => { doc.text(`• ${c}`, margin + 5, yPos); yPos += 5 })
  }

  // Exclusions
  if (data.exclusions?.length) {
    yPos += 5
    doc.setFillColor(...secondaryColor)
    doc.rect(margin, yPos, pageWidth - margin * 2, 6, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text('EXCLUSIONS', margin + 5, yPos + 4.5)
    yPos += 10
    doc.setTextColor(...darkGray)
    doc.setFont('helvetica', 'normal')
    data.exclusions.forEach(e => { doc.text(`• ${e}`, margin + 5, yPos); yPos += 5 })
  }

  // Signature
  if (data.signature) {
    yPos += 15
    doc.setDrawColor(156, 163, 175)
    doc.line(margin, yPos, margin + 60, yPos)
    if (data.signature.image) { try { doc.addImage(data.signature.image, 'PNG', margin, yPos - 20, 50, 20) } catch {} }
    yPos += 5
    doc.setFont('helvetica', 'bold')
    doc.text(data.signature.name, margin, yPos)
    if (data.signature.title) { yPos += 5; doc.setFont('helvetica', 'normal'); doc.text(data.signature.title, margin, yPos) }
  }

  // Footer
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175)
    doc.text(`Page ${i} de ${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' })
    doc.text('Généré par DAST Solutions', pageWidth - margin, doc.internal.pageSize.getHeight() - 10, { align: 'right' })
  }

  return doc
}

export function downloadSoumissionPDF(data: SoumissionPDFData, filename?: string): void {
  generateSoumissionPDF(data).save(filename || `Soumission_${data.soumission.number}.pdf`)
}

export function openSoumissionPDF(data: SoumissionPDFData): void {
  const blob = generateSoumissionPDF(data).output('blob')
  window.open(URL.createObjectURL(blob), '_blank')
}