/**
 * DAST Solutions - Page Takeoff
 * Module de relevé de quantités sur plans avec OCR
 */
import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { PageTitle } from '@/components/PageTitle'
import { TakeoffViewer } from '@/components/Takeoff'
import { useProjects } from '@/hooks/useProjects'
import { useTakeoff } from '@/hooks/takeoff/useTakeoff'
import { useToast } from '@/components/ToastProvider'
import { ArrowLeft, Save, FileSpreadsheet, Download } from 'lucide-react'
import type { Measurement } from '@/types/takeoff-measure-types'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export function Takeoff() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { projects } = useProjects()
  const { toast } = useToast()
  const { 
    items, 
    documents,
    createItem, 
    loading 
  } = useTakeoff(projectId || '')

  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const project = projects.find(p => p.id === projectId)

  // Sauvegarder les mesures dans Supabase
  const handleSaveMeasurements = async (newMeasurements: Measurement[]) => {
    setMeasurements(newMeasurements)
    // Auto-save silencieux
    console.log('Auto-save:', newMeasurements.length, 'mesures')
  }

  // Exporter vers le module d'estimation
  const handleExportToEstimation = async (measurementsToExport: Measurement[]) => {
    setIsSaving(true)
    try {
      // Grouper par catégorie et créer des items de takeoff
      for (const m of measurementsToExport) {
        await createItem({
          category: m.category,
          item_name: m.label,
          quantity: m.value,
          unit: m.unit,
          notes: m.notes
        })
      }
      toast(`${measurementsToExport.length} éléments exportés vers l'estimation`, 'success')
      navigate(`/projets/${projectId}/estimation`)
    } catch (error) {
      console.error('Export error:', error)
      toast('Erreur lors de l\'export', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // Export PDF
  const handleExportPDF = () => {
    if (measurements.length === 0) {
      toast('Aucune mesure à exporter', 'error')
      return
    }

    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text(`Relevé de quantités - ${project?.name || 'Projet'}`, 14, 20)
    doc.setFontSize(10)
    doc.text(`Date: ${new Date().toLocaleDateString('fr-CA')}`, 14, 28)

    // Tableau des mesures
    const tableData = measurements.map(m => [
      m.category,
      m.label,
      m.type === 'line' ? 'Longueur' : m.type === 'area' || m.type === 'rectangle' ? 'Surface' : 'Comptage',
      m.value.toFixed(2),
      m.unit,
      `Page ${m.pageNumber}`
    ])

    autoTable(doc, {
      head: [['Catégorie', 'Élément', 'Type', 'Valeur', 'Unité', 'Page']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [20, 184, 166] }
    })

    // Résumé
    const totalLinear = measurements.filter(m => m.type === 'line').reduce((s, m) => s + m.value, 0)
    const totalArea = measurements.filter(m => m.type === 'area' || m.type === 'rectangle').reduce((s, m) => s + m.value, 0)
    const totalCount = measurements.filter(m => m.type === 'count').reduce((s, m) => s + m.value, 0)

    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(11)
    doc.text('Résumé:', 14, finalY)
    doc.setFontSize(10)
    doc.text(`Longueurs totales: ${totalLinear.toFixed(2)} m`, 14, finalY + 7)
    doc.text(`Surfaces totales: ${totalArea.toFixed(2)} m²`, 14, finalY + 14)
    doc.text(`Comptage total: ${totalCount} unités`, 14, finalY + 21)

    doc.save(`takeoff_${project?.name || 'projet'}_${new Date().toISOString().split('T')[0]}.pdf`)
    toast('PDF exporté', 'success')
  }

  // Export Excel
  const handleExportXLSX = () => {
    if (measurements.length === 0) {
      toast('Aucune mesure à exporter', 'error')
      return
    }

    const wsData = [
      ['Relevé de quantités', project?.name || 'Projet'],
      ['Date', new Date().toLocaleDateString('fr-CA')],
      [],
      ['Catégorie', 'Élément', 'Type', 'Valeur', 'Unité', 'Page', 'Notes'],
      ...measurements.map(m => [
        m.category,
        m.label,
        m.type,
        m.value,
        m.unit,
        m.pageNumber,
        m.notes || ''
      ]),
      [],
      ['Résumé'],
      ['Longueurs totales (m)', measurements.filter(m => m.type === 'line').reduce((s, m) => s + m.value, 0)],
      ['Surfaces totales (m²)', measurements.filter(m => m.type === 'area' || m.type === 'rectangle').reduce((s, m) => s + m.value, 0)],
      ['Comptage total', measurements.filter(m => m.type === 'count').reduce((s, m) => s + m.value, 0)]
    ]

    const ws = XLSX.utils.aoa_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Takeoff')
    XLSX.writeFile(wb, `takeoff_${project?.name || 'projet'}_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast('Excel exporté', 'success')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </button>
          <PageTitle 
            title="Relevé de quantités" 
            subtitle={project?.name || 'Nouveau projet'} 
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {measurements.length > 0 && (
            <>
              <button
                onClick={handleExportPDF}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Download size={18} />
                PDF
              </button>
              <button
                onClick={handleExportXLSX}
                className="btn btn-secondary flex items-center gap-2"
              >
                <FileSpreadsheet size={18} />
                Excel
              </button>
              <button
                onClick={() => handleExportToEstimation(measurements)}
                disabled={isSaving}
                className="btn btn-primary flex items-center gap-2"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <Save size={18} />
                )}
                Vers Estimation
              </button>
            </>
          )}
        </div>
      </div>

      {/* Statistiques rapides */}
      {measurements.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-sm text-gray-500">Mesures</div>
            <div className="text-2xl font-bold text-gray-800">{measurements.length}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-sm text-gray-500">Longueurs</div>
            <div className="text-2xl font-bold text-blue-600">
              {measurements.filter(m => m.type === 'line').reduce((s, m) => s + m.value, 0).toFixed(1)} m
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-sm text-gray-500">Surfaces</div>
            <div className="text-2xl font-bold text-green-600">
              {measurements.filter(m => m.type === 'area' || m.type === 'rectangle').reduce((s, m) => s + m.value, 0).toFixed(1)} m²
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-sm text-gray-500">Comptage</div>
            <div className="text-2xl font-bold text-orange-600">
              {measurements.filter(m => m.type === 'count').reduce((s, m) => s + m.value, 0)} unités
            </div>
          </div>
        </div>
      )}

      {/* Viewer principal */}
      <TakeoffViewer
        projectId={projectId || ''}
        onSaveMeasurements={handleSaveMeasurements}
        onExportToEstimation={handleExportToEstimation}
        initialMeasurements={measurements}
      />

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">💡 Guide rapide</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-blue-700">
          <div>
            <strong>Ligne (L):</strong> 2 clics pour mesurer une longueur
          </div>
          <div>
            <strong>Rectangle (R):</strong> 2 clics pour les coins opposés
          </div>
          <div>
            <strong>Polygone (P):</strong> Clics multiples, double-clic pour fermer
          </div>
          <div>
            <strong>Comptage (C):</strong> 1 clic = 1 unité
          </div>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          <strong>OCR:</strong> Utilisez l'onglet OCR pour détecter automatiquement les dimensions écrites sur le plan
        </p>
      </div>
    </div>
  )
}
