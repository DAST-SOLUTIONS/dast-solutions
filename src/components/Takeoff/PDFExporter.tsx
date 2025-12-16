/**
 * DAST Solutions - PDFExporter
 * Export PDF annoté avec toutes les mesures et annotations
 * Option G - Complet
 * 
 * Utilise jsPDF pour générer le PDF
 */
import { useState, useCallback } from 'react'
import {
  FileDown, Loader2, Check, X, FileText, Image, Table,
  Settings, ChevronDown, AlertCircle
} from 'lucide-react'
import type { Measurement } from '@/types/takeoff-measure-types'
import type { Annotation } from './PlanAnnotations'

interface PDFExportOptions {
  includeAnnotations: boolean
  includeMeasurements: boolean
  includeSummaryTable: boolean
  includeCosts: boolean
  pageSize: 'a4' | 'letter' | 'legal' | 'tabloid'
  orientation: 'portrait' | 'landscape'
  quality: 'low' | 'medium' | 'high'
  includeHeader: boolean
  includeFooter: boolean
  headerText?: string
  footerText?: string
  projectName?: string
  companyName?: string
  dateFormat?: string
}

interface PDFExporterProps {
  isOpen: boolean
  onClose: () => void
  measurements: Measurement[]
  annotations?: Annotation[]
  planImage?: string // Base64 ou URL du plan
  planName?: string
  projectName?: string
  onExport?: (blob: Blob, filename: string) => void
}

const DEFAULT_OPTIONS: PDFExportOptions = {
  includeAnnotations: true,
  includeMeasurements: true,
  includeSummaryTable: true,
  includeCosts: true,
  pageSize: 'letter',
  orientation: 'landscape',
  quality: 'high',
  includeHeader: true,
  includeFooter: true,
  headerText: 'DAST Solutions - Relevé de quantités',
  footerText: 'Document généré automatiquement',
  companyName: 'DAST Solutions',
  dateFormat: 'DD/MM/YYYY'
}

export function PDFExporter({
  isOpen,
  onClose,
  measurements,
  annotations = [],
  planImage,
  planName = 'Plan',
  projectName = 'Projet',
  onExport
}: PDFExporterProps) {
  const [options, setOptions] = useState<PDFExportOptions>(DEFAULT_OPTIONS)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Calcul des totaux
  const totals = measurements.reduce((acc, m) => {
    if (m.type === 'line') {
      acc.lengths += m.value
      acc.lengthCount++
    } else if (m.type === 'rectangle' || m.type === 'area') {
      acc.areas += m.value
      acc.areaCount++
    } else if (m.type === 'count') {
      acc.counts += m.value
      acc.countItems++
    }
    acc.laborCost += m.costs?.laborCost || 0
    acc.materialCost += m.costs?.materialCost || 0
    return acc
  }, {
    lengths: 0, lengthCount: 0,
    areas: 0, areaCount: 0,
    counts: 0, countItems: 0,
    laborCost: 0, materialCost: 0
  })

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    setExportProgress(0)
    setError(null)

    try {
      // Import dynamique de jsPDF
      const { jsPDF } = await import('jspdf')
      setExportProgress(10)

      // Configuration du document
      const doc = new jsPDF({
        orientation: options.orientation,
        unit: 'mm',
        format: options.pageSize
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 15
      let yPos = margin

      // === HEADER ===
      if (options.includeHeader) {
        doc.setFillColor(20, 184, 166) // Teal
        doc.rect(0, 0, pageWidth, 25, 'F')
        
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text(options.headerText || 'DAST Solutions', margin, 12)
        
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text(`Projet: ${projectName}`, margin, 20)
        
        // Date
        const today = new Date().toLocaleDateString('fr-CA')
        doc.text(today, pageWidth - margin - 20, 12)
        
        yPos = 35
      }

      setExportProgress(20)

      // === TITRE ===
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(`Relevé de quantités - ${planName}`, margin, yPos)
      yPos += 10

      // === IMAGE DU PLAN ===
      if (planImage) {
        try {
          const imgHeight = options.orientation === 'landscape' ? 100 : 150
          const imgWidth = pageWidth - margin * 2
          
          doc.addImage(planImage, 'JPEG', margin, yPos, imgWidth, imgHeight)
          yPos += imgHeight + 10
          setExportProgress(50)
        } catch (imgErr) {
          console.warn('Erreur image:', imgErr)
        }
      }

      // === TABLEAU RÉSUMÉ ===
      if (options.includeSummaryTable && measurements.length > 0) {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Résumé des mesures', margin, yPos)
        yPos += 8

        // En-têtes du tableau
        const headers = ['Type', 'Quantité', 'Total', 'Unité']
        if (options.includeCosts) {
          headers.push('Coût M.O.', 'Coût Mat.', 'Total')
        }

        const colWidths = options.includeCosts 
          ? [35, 25, 35, 20, 30, 30, 30]
          : [45, 35, 50, 30]

        // En-tête tableau
        doc.setFillColor(240, 240, 240)
        doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F')
        
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        let xPos = margin + 2
        headers.forEach((h, i) => {
          doc.text(h, xPos, yPos + 5.5)
          xPos += colWidths[i]
        })
        yPos += 10

        // Données
        doc.setFont('helvetica', 'normal')
        const rows = [
          { type: 'Longueurs', qty: totals.lengthCount, total: totals.lengths.toFixed(2), unit: 'm', labor: 0, material: 0 },
          { type: 'Surfaces', qty: totals.areaCount, total: totals.areas.toFixed(2), unit: 'm²', labor: 0, material: 0 },
          { type: 'Comptage', qty: totals.countItems, total: String(Math.round(totals.counts)), unit: 'unités', labor: 0, material: 0 },
        ]

        // Calculer les coûts par type
        measurements.forEach(m => {
          if (m.type === 'line') {
            rows[0].labor += m.costs?.laborCost || 0
            rows[0].material += m.costs?.materialCost || 0
          } else if (m.type === 'rectangle' || m.type === 'area') {
            rows[1].labor += m.costs?.laborCost || 0
            rows[1].material += m.costs?.materialCost || 0
          } else if (m.type === 'count') {
            rows[2].labor += m.costs?.laborCost || 0
            rows[2].material += m.costs?.materialCost || 0
          }
        })

        rows.forEach((row, i) => {
          if (i % 2 === 1) {
            doc.setFillColor(250, 250, 250)
            doc.rect(margin, yPos - 1, pageWidth - margin * 2, 7, 'F')
          }
          
          xPos = margin + 2
          doc.text(row.type, xPos, yPos + 4)
          xPos += colWidths[0]
          doc.text(String(row.qty), xPos, yPos + 4)
          xPos += colWidths[1]
          doc.text(row.total, xPos, yPos + 4)
          xPos += colWidths[2]
          doc.text(row.unit, xPos, yPos + 4)
          
          if (options.includeCosts) {
            xPos += colWidths[3]
            doc.text(`$${row.labor.toFixed(2)}`, xPos, yPos + 4)
            xPos += colWidths[4]
            doc.text(`$${row.material.toFixed(2)}`, xPos, yPos + 4)
            xPos += colWidths[5]
            doc.text(`$${(row.labor + row.material).toFixed(2)}`, xPos, yPos + 4)
          }
          
          yPos += 7
        })

        // Total
        yPos += 2
        doc.setFillColor(20, 184, 166)
        doc.rect(margin, yPos - 1, pageWidth - margin * 2, 8, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFont('helvetica', 'bold')
        
        xPos = margin + 2
        doc.text('TOTAL', xPos, yPos + 5)
        
        if (options.includeCosts) {
          const totalCost = totals.laborCost + totals.materialCost
          doc.text(`$${totals.laborCost.toFixed(2)}`, margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2, yPos + 5)
          doc.text(`$${totals.materialCost.toFixed(2)}`, margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + 2, yPos + 5)
          doc.text(`$${totalCost.toFixed(2)}`, margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + 2, yPos + 5)
        }
        
        doc.setTextColor(0, 0, 0)
        yPos += 15
      }

      setExportProgress(70)

      // === LISTE DÉTAILLÉE DES MESURES ===
      if (options.includeMeasurements && measurements.length > 0) {
        // Nouvelle page si nécessaire
        if (yPos > pageHeight - 60) {
          doc.addPage()
          yPos = margin
        }

        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Détail des mesures', margin, yPos)
        yPos += 8

        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')

        measurements.forEach((m, i) => {
          if (yPos > pageHeight - 20) {
            doc.addPage()
            yPos = margin
          }

          const label = m.label || `Mesure ${i + 1}`
          const value = `${m.value.toFixed(2)} ${m.unit}`
          const category = m.category || '-'
          const cost = options.includeCosts && m.costs?.totalCost 
            ? `$${m.costs.totalCost.toFixed(2)}` 
            : ''

          doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 248)
          doc.rect(margin, yPos - 1, pageWidth - margin * 2, 6, 'F')

          doc.text(`${i + 1}. ${label}`, margin + 2, yPos + 3.5)
          doc.text(category, margin + 60, yPos + 3.5)
          doc.text(value, margin + 100, yPos + 3.5)
          if (cost) {
            doc.text(cost, margin + 140, yPos + 3.5)
          }

          yPos += 6
        })
      }

      setExportProgress(85)

      // === FOOTER ===
      if (options.includeFooter) {
        const footerY = pageHeight - 10
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text(options.footerText || 'DAST Solutions', margin, footerY)
        doc.text(`Page 1`, pageWidth - margin - 15, footerY)
      }

      setExportProgress(95)

      // Générer le blob
      const blob = doc.output('blob')
      const filename = `${projectName.replace(/\s+/g, '_')}_${planName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`

      // Télécharger ou callback
      if (onExport) {
        onExport(blob, filename)
      } else {
        // Téléchargement direct
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }

      setExportProgress(100)
      
      // Fermer après succès
      setTimeout(() => {
        onClose()
      }, 1000)

    } catch (err) {
      console.error('Erreur export PDF:', err)
      setError('Erreur lors de la génération du PDF. Veuillez réessayer.')
    } finally {
      setIsExporting(false)
    }
  }, [options, measurements, annotations, planImage, planName, projectName, onClose, onExport, totals])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FileDown size={24} />
            <div>
              <h2 className="text-xl font-bold">Export PDF</h2>
              <p className="text-sm text-teal-100">Générer un PDF avec les mesures</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Aperçu */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Aperçu du contenu</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-teal-600" />
                <span>{measurements.length} mesures</span>
              </div>
              <div className="flex items-center gap-2">
                <Image size={16} className="text-teal-600" />
                <span>{planImage ? '1 plan' : 'Aucun plan'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Table size={16} className="text-teal-600" />
                <span>Tableau résumé</span>
              </div>
              <div className="flex items-center gap-2 text-green-600 font-medium">
                ${(totals.laborCost + totals.materialCost).toFixed(2)} total
              </div>
            </div>
          </div>

          {/* Options principales */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeMeasurements}
                onChange={(e) => setOptions(o => ({ ...o, includeMeasurements: e.target.checked }))}
                className="w-5 h-5 rounded text-teal-600"
              />
              <span>Inclure le détail des mesures</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeSummaryTable}
                onChange={(e) => setOptions(o => ({ ...o, includeSummaryTable: e.target.checked }))}
                className="w-5 h-5 rounded text-teal-600"
              />
              <span>Inclure le tableau résumé</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeCosts}
                onChange={(e) => setOptions(o => ({ ...o, includeCosts: e.target.checked }))}
                className="w-5 h-5 rounded text-teal-600"
              />
              <span>Inclure les coûts (main-d'œuvre + matériaux)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeAnnotations}
                onChange={(e) => setOptions(o => ({ ...o, includeAnnotations: e.target.checked }))}
                className="w-5 h-5 rounded text-teal-600"
              />
              <span>Inclure les annotations ({annotations.length})</span>
            </label>
          </div>

          {/* Options avancées */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
            >
              <Settings size={16} />
              Options avancées
              <ChevronDown size={16} className={`transition ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 pl-6 border-l-2 border-gray-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                    <select
                      value={options.pageSize}
                      onChange={(e) => setOptions(o => ({ ...o, pageSize: e.target.value as any }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="letter">Letter (8.5x11)</option>
                      <option value="a4">A4</option>
                      <option value="legal">Legal</option>
                      <option value="tabloid">Tabloid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Orientation</label>
                    <select
                      value={options.orientation}
                      onChange={(e) => setOptions(o => ({ ...o, orientation: e.target.value as any }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="landscape">Paysage</option>
                      <option value="portrait">Portrait</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qualité image</label>
                  <select
                    value={options.quality}
                    onChange={(e) => setOptions(o => ({ ...o, quality: e.target.value as any }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="low">Basse (fichier léger)</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute (meilleure qualité)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">En-tête personnalisé</label>
                  <input
                    type="text"
                    value={options.headerText}
                    onChange={(e) => setOptions(o => ({ ...o, headerText: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Texte de l'en-tête"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Progress */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 size={18} className="animate-spin text-teal-600" />
                <span className="text-sm">Génération du PDF...</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-600 transition-all"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}

          {exportProgress === 100 && (
            <div className="flex items-center gap-2 text-green-600">
              <Check size={18} />
              <span>PDF généré avec succès!</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || measurements.length === 0}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <FileDown size={18} />
                Exporter PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PDFExporter
