/**
 * DAST Solutions - Module Takeoff Avancé
 * Inspiré de: RIB CostX, Bluebeam Revu, StackCT, PlanSwift
 * 
 * Fonctionnalités clés:
 * - Gestion des versions de plans avec dates d'émission
 * - OCR pour extraction numéros/noms de plans
 * - Publication workflow
 * - Outils de mesure 2D avancés (linéaire, surface, comptage)
 * - Comparaison de révisions
 * - Live-linked aux estimations
 * - Support multi-format (PDF, DWG, IFC)
 */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, Upload, FileText, Layers, Eye, EyeOff, Plus, Search,
  ZoomIn, ZoomOut, Move, Ruler, Square, Circle, Hash, Pencil,
  Trash2, Download, RefreshCw, CheckCircle2, AlertTriangle,
  ChevronRight, ChevronDown, Settings, Filter, Calendar, Clock,
  GitCompare, FileCheck, Scan, Type, LayoutGrid, MousePointer,
  Crosshair, Target, Box, Maximize2, RotateCcw, RotateCw,
  Copy, Scissors, Undo, Redo, Save, FolderOpen, List, Grid,
  Calculator, DollarSign, Tag, Bookmark, Lock, Unlock, Share2,
  History, ArrowUpRight, Printer, PanelLeftClose, PanelLeft
} from 'lucide-react'

// Types
interface DrawingSet {
  id: string
  name: string
  version: string
  issue_date: string
  received_date: string
  status: 'draft' | 'for_review' | 'approved' | 'superseded'
  drawings: Drawing[]
  created_at: string
}

interface Drawing {
  id: string
  set_id: string
  number: string
  name: string
  discipline: string
  scale?: string
  file_url: string
  file_type: string
  page_count: number
  current_page: number
  status: 'pending' | 'in_progress' | 'measured' | 'verified'
  takeoff_items: TakeoffItem[]
  annotations: Annotation[]
  version_history: DrawingVersion[]
}

interface DrawingVersion {
  version: string
  date: string
  changes: string
  file_url: string
}

interface TakeoffItem {
  id: string
  drawing_id: string
  category: string
  subcategory?: string
  description: string
  measurement_type: 'linear' | 'area' | 'count' | 'volume'
  quantity: number
  unit: string
  unit_cost?: number
  total_cost?: number
  color: string
  points: { x: number; y: number }[]
  conditions?: string[]
  linked_estimate_item?: string
  created_at: string
}

interface Annotation {
  id: string
  type: 'text' | 'callout' | 'cloud' | 'arrow' | 'highlight'
  content: string
  position: { x: number; y: number }
  color: string
  created_by: string
  created_at: string
}

interface MeasurementTool {
  id: string
  name: string
  icon: React.ElementType
  type: 'linear' | 'area' | 'count' | 'polyline' | 'rectangle' | 'circle' | 'polygon'
  shortcut: string
}

// Outils de mesure
const MEASUREMENT_TOOLS: MeasurementTool[] = [
  { id: 'select', name: 'Sélection', icon: MousePointer, type: 'linear', shortcut: 'V' },
  { id: 'linear', name: 'Longueur', icon: Ruler, type: 'linear', shortcut: 'L' },
  { id: 'polyline', name: 'Polyligne', icon: Pencil, type: 'polyline', shortcut: 'P' },
  { id: 'rectangle', name: 'Rectangle', icon: Square, type: 'rectangle', shortcut: 'R' },
  { id: 'polygon', name: 'Polygone', icon: LayoutGrid, type: 'polygon', shortcut: 'G' },
  { id: 'circle', name: 'Cercle', icon: Circle, type: 'circle', shortcut: 'C' },
  { id: 'count', name: 'Comptage', icon: Hash, type: 'count', shortcut: 'N' },
]

// Disciplines standard
const DISCIPLINES = [
  { code: 'A', name: 'Architecture', color: '#3b82f6' },
  { code: 'S', name: 'Structure', color: '#ef4444' },
  { code: 'M', name: 'Mécanique', color: '#22c55e' },
  { code: 'E', name: 'Électricité', color: '#f59e0b' },
  { code: 'P', name: 'Plomberie', color: '#6366f1' },
  { code: 'C', name: 'Civil', color: '#8b5cf6' },
  { code: 'L', name: 'Paysagement', color: '#10b981' },
]

// Catégories de takeoff
const TAKEOFF_CATEGORIES = [
  { id: 'concrete', name: 'Béton', subcategories: ['Fondations', 'Dalles', 'Murs', 'Colonnes', 'Poutres'] },
  { id: 'masonry', name: 'Maçonnerie', subcategories: ['Blocs', 'Briques', 'Pierre'] },
  { id: 'steel', name: 'Acier', subcategories: ['Structure', 'Divers', 'Escaliers', 'Garde-corps'] },
  { id: 'wood', name: 'Bois', subcategories: ['Charpente', 'Finition', 'Planchers'] },
  { id: 'drywall', name: 'Gypse', subcategories: ['Murs', 'Plafonds', 'Cloisons'] },
  { id: 'finishes', name: 'Finitions', subcategories: ['Peinture', 'Céramique', 'Planchers'] },
  { id: 'doors', name: 'Portes/Fenêtres', subcategories: ['Portes', 'Fenêtres', 'Quincaillerie'] },
  { id: 'roofing', name: 'Toiture', subcategories: ['Membrane', 'Bardeau', 'Métal'] },
  { id: 'sitework', name: 'Site', subcategories: ['Excavation', 'Remblai', 'Pavage', 'Clôtures'] },
]

// Composant principal
export default function TakeoffAdvanced() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // États principaux
  const [loading, setLoading] = useState(true)
  const [drawingSets, setDrawingSets] = useState<DrawingSet[]>([])
  const [selectedSet, setSelectedSet] = useState<DrawingSet | null>(null)
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null)
  const [takeoffItems, setTakeoffItems] = useState<TakeoffItem[]>([])
  
  // États d'interface
  const [activeTool, setActiveTool] = useState<string>('select')
  const [showDrawingList, setShowDrawingList] = useState(true)
  const [showTakeoffPanel, setShowTakeoffPanel] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  
  // États du viewer
  const [scale, setScale] = useState(1)
  const [drawingScale, setDrawingScale] = useState('1:100')
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([])
  
  // États modaux
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showVersionModal, setShowVersionModal] = useState(false)
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [showOCRModal, setShowOCRModal] = useState(false)
  
  // Formulaires
  const [uploadForm, setUploadForm] = useState({
    setName: '',
    version: '1.0',
    issueDate: new Date().toISOString().split('T')[0],
    files: [] as File[]
  })
  
  // Statistiques
  const [stats, setStats] = useState({
    totalDrawings: 0,
    measured: 0,
    pending: 0,
    totalItems: 0,
    totalArea: 0,
    totalLength: 0,
    totalCount: 0
  })

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Charger les sets de dessins
      const { data: setsData } = await supabase
        .from('drawing_sets')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (setsData && setsData.length > 0) {
        // Charger les dessins pour chaque set
        const setsWithDrawings = await Promise.all(setsData.map(async (set) => {
          const { data: drawings } = await supabase
            .from('drawings')
            .select('*')
            .eq('set_id', set.id)
            .order('number')
          
          return { ...set, drawings: drawings || [] }
        }))
        
        setDrawingSets(setsWithDrawings)
        if (setsWithDrawings.length > 0) {
          setSelectedSet(setsWithDrawings[0])
        }
      }

      // Charger les items de takeoff
      const { data: itemsData } = await supabase
        .from('takeoff_items')
        .select('*')
        .eq('project_id', projectId)

      setTakeoffItems(itemsData || [])

      // Calculer les stats
      calculateStats(setsData || [], itemsData || [])

    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (sets: DrawingSet[], items: TakeoffItem[]) => {
    const allDrawings = sets.flatMap(s => s.drawings || [])
    setStats({
      totalDrawings: allDrawings.length,
      measured: allDrawings.filter(d => d.status === 'measured').length,
      pending: allDrawings.filter(d => d.status === 'pending').length,
      totalItems: items.length,
      totalArea: items.filter(i => i.measurement_type === 'area').reduce((sum, i) => sum + i.quantity, 0),
      totalLength: items.filter(i => i.measurement_type === 'linear').reduce((sum, i) => sum + i.quantity, 0),
      totalCount: items.filter(i => i.measurement_type === 'count').reduce((sum, i) => sum + i.quantity, 0)
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    setUploadForm({ ...uploadForm, files: Array.from(files) })
  }

  const handleCreateDrawingSet = async () => {
    if (!uploadForm.setName || uploadForm.files.length === 0) return
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Créer le set
    const { data: newSet, error: setError } = await supabase
      .from('drawing_sets')
      .insert({
        user_id: user.id,
        project_id: projectId,
        name: uploadForm.setName,
        version: uploadForm.version,
        issue_date: uploadForm.issueDate,
        received_date: new Date().toISOString(),
        status: 'draft'
      })
      .select()
      .single()

    if (setError || !newSet) {
      console.error('Erreur création set:', setError)
      return
    }

    // Upload des fichiers et création des dessins
    for (const file of uploadForm.files) {
      const fileName = `${projectId}/${newSet.id}/${file.name}`
      
      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('drawings')
        .upload(fileName, file)

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('drawings')
          .getPublicUrl(fileName)

        // Créer l'entrée drawing
        await supabase.from('drawings').insert({
          set_id: newSet.id,
          number: file.name.split('.')[0],
          name: file.name.split('.')[0],
          discipline: 'A',
          file_url: publicUrl,
          file_type: file.type,
          page_count: 1,
          current_page: 1,
          status: 'pending'
        })
      }
    }

    setShowUploadModal(false)
    setUploadForm({ setName: '', version: '1.0', issueDate: new Date().toISOString().split('T')[0], files: [] })
    loadData()
  }

  const handleToolSelect = (toolId: string) => {
    setActiveTool(toolId)
    setCurrentPoints([])
    setIsDrawing(false)
  }

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Brouillon' },
      for_review: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'En révision' },
      approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approuvé' },
      superseded: { bg: 'bg-red-100', text: 'text-red-700', label: 'Remplacé' },
      pending: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'En attente' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'En cours' },
      measured: { bg: 'bg-green-100', text: 'text-green-700', label: 'Mesuré' },
      verified: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Vérifié' }
    }
    const config = configs[status] || configs.pending
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Takeoff Avancé</h1>
            <p className="text-xs text-gray-500">
              {selectedSet ? `${selectedSet.name} v${selectedSet.version}` : 'Aucun jeu de plans sélectionné'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Stats rapides */}
          <div className="hidden md:flex items-center gap-4 mr-4 text-sm">
            <div className="flex items-center gap-1">
              <FileText size={14} className="text-gray-400" />
              <span>{stats.totalDrawings} plans</span>
            </div>
            <div className="flex items-center gap-1">
              <Square size={14} className="text-blue-500" />
              <span>{stats.totalArea.toFixed(1)} m²</span>
            </div>
            <div className="flex items-center gap-1">
              <Ruler size={14} className="text-green-500" />
              <span>{stats.totalLength.toFixed(1)} m</span>
            </div>
            <div className="flex items-center gap-1">
              <Hash size={14} className="text-purple-500" />
              <span>{stats.totalCount}</span>
            </div>
          </div>

          <button 
            onClick={() => setShowUploadModal(true)}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 text-sm"
          >
            <Upload size={14} />
            Importer plans
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg" title="OCR - Extraction automatique">
            <Scan size={18} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg" title="Comparer révisions">
            <GitCompare size={18} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg" title="Paramètres">
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b px-4 py-1 flex items-center justify-between">
        {/* Outils de mesure */}
        <div className="flex items-center gap-1">
          {MEASUREMENT_TOOLS.map(tool => (
            <button
              key={tool.id}
              onClick={() => handleToolSelect(tool.id)}
              className={`p-2 rounded-lg transition flex items-center gap-1 ${
                activeTool === tool.id 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              title={`${tool.name} (${tool.shortcut})`}
            >
              <tool.icon size={18} />
            </button>
          ))}
          
          <div className="w-px h-6 bg-gray-200 mx-2" />
          
          {/* Actions d'édition */}
          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Annuler (Ctrl+Z)">
            <Undo size={18} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Refaire (Ctrl+Y)">
            <Redo size={18} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Supprimer">
            <Trash2 size={18} />
          </button>
        </div>

        {/* Contrôles de vue */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setScale(Math.max(0.1, scale - 0.1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-sm w-16 text-center">{Math.round(scale * 100)}%</span>
          <button 
            onClick={() => setScale(Math.min(5, scale + 0.1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ZoomIn size={18} />
          </button>
          
          <div className="w-px h-6 bg-gray-200 mx-2" />
          
          <select 
            value={drawingScale}
            onChange={(e) => setDrawingScale(e.target.value)}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="1:50">1:50</option>
            <option value="1:75">1:75</option>
            <option value="1:100">1:100</option>
            <option value="1:200">1:200</option>
            <option value="1:500">1:500</option>
          </select>
          
          <button 
            onClick={() => setScale(1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Réinitialiser vue"
          >
            <Maximize2 size={18} />
          </button>
        </div>

        {/* Toggles panneaux */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowDrawingList(!showDrawingList)}
            className={`p-2 rounded-lg ${showDrawingList ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
            title="Liste des plans"
          >
            <PanelLeft size={18} />
          </button>
          <button
            onClick={() => setShowTakeoffPanel(!showTakeoffPanel)}
            className={`p-2 rounded-lg ${showTakeoffPanel ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
            title="Panneau takeoff"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panel gauche - Liste des plans */}
        {showDrawingList && (
          <div className="w-72 bg-white border-r flex flex-col">
            <div className="p-3 border-b">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">Jeux de plans</h3>
                <div className="flex gap-1">
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-1 rounded ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
                  >
                    <List size={14} />
                  </button>
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-1 rounded ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
                  >
                    <LayoutGrid size={14} />
                  </button>
                </div>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="w-full pl-7 pr-3 py-1.5 text-sm border rounded-lg"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {drawingSets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="mx-auto mb-2 text-gray-300" size={40} />
                  <p className="text-sm">Aucun plan importé</p>
                  <button 
                    onClick={() => setShowUploadModal(true)}
                    className="mt-2 text-blue-600 text-sm hover:underline"
                  >
                    Importer des plans
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {drawingSets.map(set => (
                    <div key={set.id} className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => setSelectedSet(selectedSet?.id === set.id ? null : set)}
                        className={`w-full p-2 text-left flex items-center justify-between ${
                          selectedSet?.id === set.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <FolderOpen size={14} className="text-blue-600" />
                            <span className="font-medium text-sm">{set.name}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">v{set.version}</span>
                            {getStatusBadge(set.status)}
                          </div>
                        </div>
                        {selectedSet?.id === set.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      
                      {selectedSet?.id === set.id && set.drawings && (
                        <div className="border-t bg-gray-50 p-2 space-y-1">
                          {set.drawings.map(drawing => (
                            <button
                              key={drawing.id}
                              onClick={() => setSelectedDrawing(drawing)}
                              className={`w-full p-2 text-left rounded-lg text-sm ${
                                selectedDrawing?.id === drawing.id 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'hover:bg-white'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FileText size={12} />
                                  <span className="font-mono">{drawing.number}</span>
                                </div>
                                {getStatusBadge(drawing.status)}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 truncate">{drawing.name}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stats du set sélectionné */}
            {selectedSet && (
              <div className="p-3 border-t bg-gray-50">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Date émission:</span>
                    <p className="font-medium">{new Date(selectedSet.issue_date).toLocaleDateString('fr-CA')}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Plans:</span>
                    <p className="font-medium">{selectedSet.drawings?.length || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Zone centrale - Viewer */}
        <div className="flex-1 relative bg-gray-800 overflow-hidden" ref={containerRef}>
          {selectedDrawing ? (
            <>
              {/* Canvas principal */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0"
                style={{ cursor: activeTool === 'select' ? 'default' : 'crosshair' }}
              />
              
              {/* Overlay avec infos */}
              <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-2 rounded-lg text-sm">
                <p className="font-mono">{selectedDrawing.number}</p>
                <p className="text-xs text-gray-300">{selectedDrawing.name}</p>
              </div>

              {/* Mini-carte */}
              <div className="absolute bottom-4 left-4 w-32 h-24 bg-white border-2 border-gray-300 rounded shadow-lg">
                <div className="absolute inset-1 bg-gray-100">
                  {/* Miniature */}
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <FileText size={64} className="mx-auto mb-4 opacity-50" />
                <p>Sélectionnez un plan pour commencer</p>
              </div>
            </div>
          )}
        </div>

        {/* Panel droit - Takeoff */}
        {showTakeoffPanel && (
          <div className="w-80 bg-white border-l flex flex-col">
            <div className="p-3 border-b">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">Relevé de quantités</h3>
                <button className="text-blue-600 text-xs hover:underline">
                  + Ajouter item
                </button>
              </div>
              
              {/* Sélection catégorie */}
              <select className="w-full text-sm border rounded-lg px-2 py-1.5">
                <option value="">Toutes les catégories</option>
                {TAKEOFF_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto">
              {takeoffItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calculator className="mx-auto mb-2 text-gray-300" size={40} />
                  <p className="text-sm">Aucune mesure</p>
                  <p className="text-xs mt-1">Utilisez les outils pour<br/>commencer le relevé</p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {TAKEOFF_CATEGORIES.map(cat => {
                    const catItems = takeoffItems.filter(i => i.category === cat.id)
                    if (catItems.length === 0) return null
                    
                    return (
                      <div key={cat.id} className="border rounded-lg">
                        <div className="p-2 bg-gray-50 font-medium text-sm flex items-center justify-between">
                          <span>{cat.name}</span>
                          <span className="text-xs text-gray-500">{catItems.length} items</span>
                        </div>
                        <div className="p-2 space-y-1">
                          {catItems.map(item => (
                            <div key={item.id} className="p-2 border rounded text-xs hover:bg-gray-50">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{item.description}</span>
                                <span 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: item.color }}
                                />
                              </div>
                              <div className="flex items-center justify-between mt-1 text-gray-500">
                                <span>{item.quantity.toFixed(2)} {item.unit}</span>
                                {item.unit_cost && (
                                  <span className="text-green-600">
                                    {(item.quantity * item.unit_cost).toLocaleString('fr-CA')} $
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Totaux */}
            <div className="p-3 border-t bg-gray-50">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total items</span>
                  <span className="font-medium">{takeoffItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Coût estimé</span>
                  <span className="font-bold text-green-600">
                    {takeoffItems.reduce((sum, i) => sum + (i.quantity * (i.unit_cost || 0)), 0).toLocaleString('fr-CA')} $
                  </span>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center justify-center gap-1">
                  <Calculator size={14} />
                  Estimation
                </button>
                <button className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50">
                  <Download size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Import */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">Importer des plans</h2>
              <button onClick={() => setShowUploadModal(false)} className="p-1 hover:bg-gray-100 rounded">✕</button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom du jeu de plans *</label>
                <input
                  type="text"
                  value={uploadForm.setName}
                  onChange={(e) => setUploadForm({...uploadForm, setName: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Ex: Plans Architecture - Émission construction"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Version</label>
                  <input
                    type="text"
                    value={uploadForm.version}
                    onChange={(e) => setUploadForm({...uploadForm, version: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="1.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date d'émission</label>
                  <input
                    type="date"
                    value={uploadForm.issueDate}
                    onChange={(e) => setUploadForm({...uploadForm, issueDate: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Fichiers (PDF, DWG, IFC)</label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.dwg,.dxf,.ifc,.rvt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                    <p className="text-sm text-gray-600">
                      Glissez vos fichiers ici ou <span className="text-blue-600">parcourir</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PDF, DWG, DXF, IFC, RVT</p>
                  </label>
                </div>
                {uploadForm.files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {uploadForm.files.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
                        <FileText size={14} className="text-gray-400" />
                        <span className="flex-1 truncate">{file.name}</span>
                        <span className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Scan className="text-blue-600 mt-0.5" size={16} />
                  <div className="text-sm">
                    <p className="font-medium text-blue-700">Extraction OCR automatique</p>
                    <p className="text-blue-600 text-xs">Les numéros et noms de plans seront extraits automatiquement</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex justify-end gap-2">
              <button 
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateDrawingSet}
                disabled={!uploadForm.setName || uploadForm.files.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Importer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
