/**
 * DAST Solutions - Page Takeoff
 * Module de relevé de quantités sur plans avec persistance automatique
 */
import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { PageTitle } from '@/components/PageTitle'
import { TakeoffViewer, PriceListImporter, WorkCrewManager } from '@/components/Takeoff'
import { useProjects } from '@/hooks/useProjects'
import { useTakeoffPersistence } from '@/hooks/takeoff/useTakeoffPersistence'
import { useToast } from '@/components/ToastProvider'
import { 
  ArrowLeft, Save, FileSpreadsheet, Download, Cloud, CloudOff, 
  DollarSign, Users, Package, Clock, CheckCircle, AlertCircle
} from 'lucide-react'
import type { Measurement } from '@/types/takeoff-measure-types'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export function Takeoff() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { projects } = useProjects()
  const { toast } = useToast()
  
  // Persistance automatique
  const {
    measurements,
    loadingMeasurements,
    saveMeasurement,
    saveMeasurements,
    deleteMeasurement,
    isSaving,
    lastSaved,
    error: persistenceError,
    exportToBid
  } = useTakeoffPersistence({
    projectId: projectId || '',
    autoSave: true,
    autoSaveDelay: 2000
  })

  // État local pour les mesures en cours d'édition
  const [localMeasurements, setLocalMeasurements] = useState<Measurement[]>([])
  const [isExporting, setIsExporting] = useState(false)
  
  // Modals
  const [showPriceImporter, setShowPriceImporter] = useState(false)
  const [showCrewManager, setShowCrewManager] = useState(false)

  const project = projects.find(p => p.id === projectId)

  // Synchroniser les mesures chargées
  useEffect(() => {
    if (!loadingMeasurements && measurements.length > 0) {
      setLocalMeasurements(measurements)
    }
  }, [measurements, loadingMeasurements])

  // Gérer les changements de mesures
  const handleMeasurementsChange = useCallback(async (newMeasurements: Measurement[]) => {
    setLocalMeasurements(newMeasurements)
    
    // Sauvegarder automatiquement
    const success = await saveMeasurements(newMeasurements)
    if (!success) {
      toast('Erreur de sauvegarde', 'error')
    }
  }, [saveMeasurements, toast])

  // Exporter vers le module soumission
  const handleExportToEstimation = useCallback(async (measurementsToExport: Measurement[]) => {
    if (measurementsToExport.length === 0) {
      toast('Aucune mesure à exporter', 'error')
      return
    }

    setIsExporting(true)
    try {
      const success = await exportToBid(measurementsToExport)
      if (success) {
        toast(`${measurementsToExport.length} éléments exportés vers la soumission`, 'success')
        navigate(`/soumissions`)
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      console.error('Export error:', error)
      toast('Erreur lors de l\'export', 'error')
    } finally {
      setIsExporting(false)
    }
  }, [exportToBid, navigate, toast])

  // Calculer les totaux
  const totalLinear = localMeasurements.filter(m => m.type === 'line').reduce((s, m) => s + m.value, 0)
  const totalArea = localMeasurements.filter(m => m.type === 'area' || m.type === 'rectangle').reduce((s, m) => s + (m.calculated?.area || m.value), 0)
  const totalCount = localMeasurements.filter(m => m.type === 'count').reduce((s, m) => s + m.value, 0)
  const totalLaborCost = localMeasurements.reduce((s, m) => s + (m.costs?.laborCost || 0), 0)
  const totalMaterialCost = localMeasurements.reduce((s, m) => s + (m.costs?.materialCost || 0), 0)
  const totalCost = totalLaborCost + totalMaterialCost

  // Export PDF avec coûts
  const handleExportPDF = useCallback(() => {
    if (localMeasurements.length === 0) {
      toast('Aucune mesure à exporter', 'error')
      return
    }

    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text(`Relevé de quantités - ${project?.name || 'Projet'}`, 14, 20)
    doc.setFontSize(10)
    doc.text(`Date: ${new Date().toLocaleDateString('fr-CA')}`, 14, 28)

    // Tableau des mesures avec coûts
    const tableData = localMeasurements.map(m => [
      m.category,
      m.label || `${m.type}`,
      m.type === 'line' ? 'Longueur' : m.type === 'area' || m.type === 'rectangle' ? 'Surface' : 'Comptage',
      m.value.toFixed(2),
      m.unit,
      m.costs?.laborCost ? `$${m.costs.laborCost.toFixed(2)}` : '-',
      m.costs?.materialCost ? `$${m.costs.materialCost.toFixed(2)}` : '-',
      m.costs?.totalCost ? `$${m.costs.totalCost.toFixed(2)}` : '-'
    ])

    autoTable(doc, {
      head: [['Catégorie', 'Élément', 'Type', 'Valeur', 'Unité', 'M-O', 'Mat.', 'Total']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [20, 184, 166] }
    })

    // Résumé
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(11)
    doc.text('Résumé:', 14, finalY)
    doc.setFontSize(10)
    doc.text(`Longueurs totales: ${totalLinear.toFixed(2)} m`, 14, finalY + 7)
    doc.text(`Surfaces totales: ${totalArea.toFixed(2)} m²`, 14, finalY + 14)
    doc.text(`Comptage total: ${totalCount} unités`, 14, finalY + 21)
    
    if (totalCost > 0) {
      doc.setFontSize(12)
      doc.text(`TOTAL: $${totalCost.toFixed(2)}`, 14, finalY + 32)
    }

    doc.save(`takeoff_${project?.name || 'projet'}_${new Date().toISOString().split('T')[0]}.pdf`)
    toast('PDF exporté', 'success')
  }, [localMeasurements, project, totalLinear, totalArea, totalCount, totalCost, toast])

  // Export Excel avec coûts
  const handleExportXLSX = useCallback(() => {
    if (localMeasurements.length === 0) {
      toast('Aucune mesure à exporter', 'error')
      return
    }

    const wsData = [
      ['Relevé de quantités', project?.name || 'Projet'],
      ['Date', new Date().toLocaleDateString('fr-CA')],
      [],
      ['Catégorie', 'Élément', 'Type', 'Valeur', 'Unité', 'Surface calc.', 'Volume calc.', 'M-O ($)', 'Mat. ($)', 'Total ($)'],
      ...localMeasurements.map(m => [
        m.category,
        m.label || m.type,
        m.type,
        m.value,
        m.unit,
        m.calculated?.area || '',
        m.calculated?.volume || '',
        m.costs?.laborCost || '',
        m.costs?.materialCost || '',
        m.costs?.totalCost || ''
      ]),
      [],
      ['Résumé'],
      ['Longueurs totales (m)', totalLinear],
      ['Surfaces totales (m²)', totalArea],
      ['Comptage total', totalCount],
      ['Main-d\'œuvre ($)', totalLaborCost],
      ['Matériaux ($)', totalMaterialCost],
      ['TOTAL ($)', totalCost]
    ]

    const ws = XLSX.utils.aoa_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Takeoff')
    XLSX.writeFile(wb, `takeoff_${project?.name || 'projet'}_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast('Excel exporté', 'success')
  }, [localMeasurements, project, totalLinear, totalArea, totalCount, totalLaborCost, totalMaterialCost, totalCost, toast])

  if (loadingMeasurements) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-500">Chargement des mesures...</p>
        </div>
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
          
          {/* Indicateur de sauvegarde */}
          <div className="flex items-center gap-2 text-sm">
            {isSaving ? (
              <span className="flex items-center gap-1 text-amber-600">
                <Cloud size={16} className="animate-pulse" />
                Sauvegarde...
              </span>
            ) : lastSaved ? (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle size={16} />
                Sauvegardé
              </span>
            ) : persistenceError ? (
              <span className="flex items-center gap-1 text-red-600">
                <AlertCircle size={16} />
                Erreur
              </span>
            ) : null}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Gestionnaires */}
          <button
            onClick={() => setShowPriceImporter(true)}
            className="btn btn-secondary flex items-center gap-2"
            title="Importer liste de prix"
          >
            <Package size={18} />
            Prix
          </button>
          <button
            onClick={() => setShowCrewManager(true)}
            className="btn btn-secondary flex items-center gap-2"
            title="Gérer les équipes"
          >
            <Users size={18} />
            Équipes
          </button>
          
          <div className="w-px h-6 bg-gray-300" />
          
          {localMeasurements.length > 0 && (
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
                onClick={() => handleExportToEstimation(localMeasurements)}
                disabled={isExporting}
                className="btn btn-primary flex items-center gap-2"
              >
                {isExporting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <Save size={18} />
                )}
                Vers Soumission
              </button>
            </>
          )}
        </div>
      </div>

      {/* Statistiques rapides */}
      {localMeasurements.length > 0 && (
        <div className="grid grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-sm text-gray-500">Mesures</div>
            <div className="text-2xl font-bold text-gray-800">{localMeasurements.length}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-sm text-gray-500">Longueurs</div>
            <div className="text-2xl font-bold text-blue-600">
              {totalLinear.toFixed(1)} m
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-sm text-gray-500">Surfaces</div>
            <div className="text-2xl font-bold text-green-600">
              {totalArea.toFixed(1)} m²
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-sm text-gray-500">Comptage</div>
            <div className="text-2xl font-bold text-orange-600">
              {totalCount} unités
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-sm text-gray-500">Main-d'œuvre</div>
            <div className="text-2xl font-bold text-purple-600">
              ${totalLaborCost.toFixed(0)}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow border-2 border-teal-200">
            <div className="text-sm text-gray-500">Total</div>
            <div className="text-2xl font-bold text-teal-600">
              ${totalCost.toFixed(0)}
            </div>
          </div>
        </div>
      )}

      {/* Viewer principal */}
      <TakeoffViewer
        projectId={projectId || ''}
        onSaveMeasurements={handleMeasurementsChange}
        onExportToEstimation={handleExportToEstimation}
        initialMeasurements={localMeasurements}
      />

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">💡 Guide rapide</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-blue-700">
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
          <div>
            <strong>Édition:</strong> Cliquez ✏️ pour ajouter dimensions et coûts
          </div>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          <strong>💾 Sauvegarde automatique:</strong> Vos mesures sont sauvegardées automatiquement dans le cloud
        </p>
      </div>

      {/* Modals */}
      <PriceListImporter
        isOpen={showPriceImporter}
        onClose={() => setShowPriceImporter(false)}
        onImportComplete={(listId) => {
          toast('Liste de prix importée', 'success')
        }}
      />

      <WorkCrewManager
        isOpen={showCrewManager}
        onClose={() => setShowCrewManager(false)}
      />
    </div>
  )
}

export default Takeoff
