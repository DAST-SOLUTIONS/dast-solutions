/**
 * DAST Solutions - Dashboard Personnalisable
 * Widgets drag & drop avec sauvegarde de configuration
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, Settings, RotateCcw, Save, X, GripVertical, Check,
  LayoutGrid, Maximize2, Minimize2
} from 'lucide-react'
import { 
  useDashboardConfig, 
  DashboardConfigProvider,
  AVAILABLE_WIDGETS,
  type WidgetConfig,
  type WidgetType
} from '@/contexts/DashboardConfigContext'
import {
  WidgetWrapper,
  KPIWidget,
  CalendarWidget,
  DeadlinesWidget,
  RecentProjectsWidget,
  RevenueChartWidget,
  QuickActionsWidget,
  WeatherWidget,
  NotificationsWidget,
  ProjectStatusWidget
} from '@/components/Dashboard/Widgets'

// ============================================================================
// WIDGET RENDERER
// ============================================================================
function WidgetRenderer({ config }: { config: WidgetConfig }) {
  switch (config.type) {
    case 'kpi-revenue':
      return <KPIWidget type="revenue" />
    case 'kpi-projects':
      return <KPIWidget type="projects" />
    case 'kpi-soumissions':
      return <KPIWidget type="soumissions" />
    case 'kpi-factures':
      return <KPIWidget type="factures" />
    case 'calendar':
      return <CalendarWidget />
    case 'deadlines':
      return <DeadlinesWidget />
    case 'recent-projects':
      return <RecentProjectsWidget />
    case 'revenue-chart':
      return <RevenueChartWidget />
    case 'quick-actions':
      return <QuickActionsWidget />
    case 'weather':
      return <WeatherWidget />
    case 'notifications':
      return <NotificationsWidget />
    case 'project-status':
      return <ProjectStatusWidget />
    default:
      return <div className="text-gray-500 text-center">Widget non disponible</div>
  }
}

// ============================================================================
// ADD WIDGET MODAL
// ============================================================================
function AddWidgetModal({ isOpen, onClose, onAdd }: { 
  isOpen: boolean
  onClose: () => void
  onAdd: (type: WidgetType) => void 
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ajouter un widget</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {AVAILABLE_WIDGETS.map(widget => (
              <button
                key={widget.type}
                onClick={() => { onAdd(widget.type); onClose() }}
                className="p-4 border dark:border-gray-700 rounded-xl hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition text-left"
              >
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">{widget.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{widget.description}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  Taille: {widget.defaultSize.w}x{widget.defaultSize.h}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// DASHBOARD GRID
// ============================================================================
function DashboardGrid() {
  const navigate = useNavigate()
  const { 
    widgets, 
    isEditMode, 
    setEditMode, 
    addWidget, 
    removeWidget, 
    moveWidget,
    resizeWidget,
    resetToDefault, 
    saveConfig 
  } = useDashboardConfig()
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  // Filtrer les widgets visibles
  const visibleWidgets = widgets.filter(w => w.visible)

  // Organiser les widgets en grille
  const getGridStyle = (widget: WidgetConfig) => {
    return {
      gridColumn: `span ${widget.w}`,
      gridRow: `span ${widget.h}`,
    }
  }

  const handleSave = async () => {
    setSaving(true)
    await saveConfig()
    setEditMode(false)
    setSaving(false)
  }

  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
    setDraggedWidget(widgetId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetWidgetId: string) => {
    e.preventDefault()
    if (!draggedWidget || draggedWidget === targetWidgetId) return

    // Échanger les positions
    const draggedIndex = widgets.findIndex(w => w.id === draggedWidget)
    const targetIndex = widgets.findIndex(w => w.id === targetWidgetId)
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const draggedPos = { x: widgets[draggedIndex].x, y: widgets[draggedIndex].y }
      const targetPos = { x: widgets[targetIndex].x, y: widgets[targetIndex].y }
      
      moveWidget(draggedWidget, targetPos.x, targetPos.y)
      moveWidget(targetWidgetId, draggedPos.x, draggedPos.y)
    }

    setDraggedWidget(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isEditMode ? 'Mode édition - Glissez les widgets pour les réorganiser' : 'Bienvenue dans DAST Solutions'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditMode ? (
            <>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 rounded-lg hover:bg-teal-200 dark:hover:bg-teal-800"
              >
                <Plus size={18} /> Ajouter widget
              </button>
              <button
                onClick={resetToDefault}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <RotateCcw size={18} /> Réinitialiser
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <X size={18} /> Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                Sauvegarder
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <LayoutGrid size={18} /> Personnaliser
              </button>
              <button
                onClick={() => navigate('/project/new')}
                className="btn btn-primary"
              >
                <Plus size={18} className="mr-1" /> Nouveau projet
              </button>
            </>
          )}
        </div>
      </div>

      {/* Grid de widgets */}
      <div 
        ref={gridRef}
        className="grid grid-cols-4 gap-4 auto-rows-[140px]"
        onDragOver={handleDragOver}
      >
        {visibleWidgets.map(widget => (
          <div
            key={widget.id}
            style={getGridStyle(widget)}
            className={`transition-all duration-200 ${
              isEditMode ? 'cursor-move' : ''
            } ${draggedWidget === widget.id ? 'opacity-50' : ''}`}
            draggable={isEditMode}
            onDragStart={(e) => handleDragStart(e, widget.id)}
            onDrop={(e) => handleDrop(e, widget.id)}
          >
            <WidgetWrapper
              config={widget}
              isEditMode={isEditMode}
              onRemove={() => removeWidget(widget.id)}
            >
              <WidgetRenderer config={widget} />
            </WidgetWrapper>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {visibleWidgets.length === 0 && (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <LayoutGrid size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucun widget affiché
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Personnalisez votre tableau de bord en ajoutant des widgets
          </p>
          <button
            onClick={() => { setEditMode(true); setShowAddModal(true) }}
            className="btn btn-primary"
          >
            <Plus size={18} className="mr-1" /> Ajouter des widgets
          </button>
        </div>
      )}

      {/* Add Widget Modal */}
      <AddWidgetModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addWidget}
      />
    </div>
  )
}

// ============================================================================
// DASHBOARD AVEC PROVIDER
// ============================================================================
export default function Dashboard() {
  return (
    <DashboardConfigProvider>
      <DashboardGrid />
    </DashboardConfigProvider>
  )
}
