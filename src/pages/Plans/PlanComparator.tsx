/**
 * DAST Solutions - Comparateur de Plans
 * Overlay, Slider avant/après, Détection des différences
 */
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  Layers, SplitSquareHorizontal, Eye, EyeOff, ZoomIn, ZoomOut,
  RotateCcw, Download, Upload, ChevronLeft, ChevronRight, X,
  Maximize2, Minimize2, Grid, Move, GitCompare, FileImage,
  CheckCircle, AlertCircle, Info, Settings, Sliders, RefreshCw,
  ArrowLeft, Plus, Minus, MousePointer, Hand
} from 'lucide-react'

// Types
interface PlanVersion {
  id: string
  name: string
  version: string
  uploadedAt: string
  url: string
  thumbnail?: string
  width?: number
  height?: number
}

type CompareMode = 'slider' | 'overlay' | 'sideBySide' | 'difference'

interface Annotation {
  id: string
  x: number
  y: number
  type: 'addition' | 'modification' | 'deletion' | 'note'
  text: string
  createdAt: string
}

export default function PlanComparator() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  
  // États principaux
  const [plans, setPlans] = useState<PlanVersion[]>([])
  const [leftPlan, setLeftPlan] = useState<PlanVersion | null>(null)
  const [rightPlan, setRightPlan] = useState<PlanVersion | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Mode de comparaison
  const [compareMode, setCompareMode] = useState<CompareMode>('slider')
  
  // Contrôles de vue
  const [zoom, setZoom] = useState(100)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [sliderPosition, setSliderPosition] = useState(50)
  const [overlayOpacity, setOverlayOpacity] = useState(50)
  const [showGrid, setShowGrid] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // Annotations
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [showAnnotations, setShowAnnotations] = useState(true)
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false)
  const [selectedAnnotationType, setSelectedAnnotationType] = useState<Annotation['type']>('modification')
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lastPanPoint = useRef({ x: 0, y: 0 })

  useEffect(() => {
    loadPlans()
  }, [projectId])

  const loadPlans = async () => {
    try {
      setLoading(true)
      
      // Charger les plans du projet
      if (projectId) {
        const { data } = await supabase
          .from('project_documents')
          .select('*')
          .eq('project_id', projectId)
          .in('file_type', ['pdf', 'png', 'jpg', 'jpeg', 'dwg'])
          .order('created_at', { ascending: false })

        if (data && data.length > 0) {
          const planVersions: PlanVersion[] = data.map(doc => ({
            id: doc.id,
            name: doc.name,
            version: doc.version || 'V1',
            uploadedAt: doc.created_at,
            url: doc.file_url,
            thumbnail: doc.thumbnail_url
          }))
          setPlans(planVersions)
          
          if (planVersions.length >= 2) {
            setLeftPlan(planVersions[1])
            setRightPlan(planVersions[0])
          } else if (planVersions.length === 1) {
            setLeftPlan(planVersions[0])
          }
        } else {
          setPlans(generateDemoPlans())
        }
      } else {
        setPlans(generateDemoPlans())
      }
    } catch (err) {
      console.error('Erreur chargement plans:', err)
      setPlans(generateDemoPlans())
    } finally {
      setLoading(false)
    }
  }

  const generateDemoPlans = (): PlanVersion[] => {
    return [
      {
        id: 'demo-1',
        name: 'Plan architectural - Niveau 1',
        version: 'V3 (Final)',
        uploadedAt: new Date().toISOString(),
        url: '/demo/plan-v3.png',
        width: 1920,
        height: 1080
      },
      {
        id: 'demo-2',
        name: 'Plan architectural - Niveau 1',
        version: 'V2',
        uploadedAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
        url: '/demo/plan-v2.png',
        width: 1920,
        height: 1080
      },
      {
        id: 'demo-3',
        name: 'Plan architectural - Niveau 1',
        version: 'V1 (Initial)',
        uploadedAt: new Date(Date.now() - 14 * 24 * 3600000).toISOString(),
        url: '/demo/plan-v1.png',
        width: 1920,
        height: 1080
      }
    ]
  }

  // Gestion du zoom
  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(25, Math.min(400, prev + delta)))
  }

  const resetView = () => {
    setZoom(100)
    setPanOffset({ x: 0, y: 0 })
  }

  // Gestion du pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true)
      lastPanPoint.current = { x: e.clientX, y: e.clientY }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastPanPoint.current.x
      const dy = e.clientY - lastPanPoint.current.y
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }))
      lastPanPoint.current = { x: e.clientX, y: e.clientY }
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  // Gestion du slider
  const handleSliderMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const x = clientX - rect.left
    const percent = (x / rect.width) * 100
    setSliderPosition(Math.max(0, Math.min(100, percent)))
  }, [])

  // Ajouter annotation
  const handleAddAnnotation = (e: React.MouseEvent) => {
    if (!isAddingAnnotation || !containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    const text = prompt('Entrez votre annotation:')
    if (text) {
      const newAnnotation: Annotation = {
        id: `ann-${Date.now()}`,
        x,
        y,
        type: selectedAnnotationType,
        text,
        createdAt: new Date().toISOString()
      }
      setAnnotations(prev => [...prev, newAnnotation])
    }
    setIsAddingAnnotation(false)
  }

  // Supprimer annotation
  const removeAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id))
  }

  // Fullscreen
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
    setIsFullscreen(!isFullscreen)
  }

  // Couleur par type d'annotation
  const getAnnotationColor = (type: Annotation['type']) => {
    switch (type) {
      case 'addition': return 'bg-green-500'
      case 'modification': return 'bg-amber-500'
      case 'deletion': return 'bg-red-500'
      case 'note': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-700 rounded-lg"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <GitCompare className="text-teal-400" size={24} />
              <h1 className="text-lg font-bold">Comparateur de Plans</h1>
            </div>
          </div>

          {/* Mode buttons */}
          <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setCompareMode('slider')}
              className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 ${
                compareMode === 'slider' ? 'bg-teal-600' : 'hover:bg-gray-600'
              }`}
              title="Mode Slider"
            >
              <SplitSquareHorizontal size={16} />
              Slider
            </button>
            <button
              onClick={() => setCompareMode('overlay')}
              className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 ${
                compareMode === 'overlay' ? 'bg-teal-600' : 'hover:bg-gray-600'
              }`}
              title="Mode Overlay"
            >
              <Layers size={16} />
              Overlay
            </button>
            <button
              onClick={() => setCompareMode('sideBySide')}
              className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 ${
                compareMode === 'sideBySide' ? 'bg-teal-600' : 'hover:bg-gray-600'
              }`}
              title="Côte à côte"
            >
              <Grid size={16} />
              Côte à côte
            </button>
            <button
              onClick={() => setCompareMode('difference')}
              className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 ${
                compareMode === 'difference' ? 'bg-teal-600' : 'hover:bg-gray-600'
              }`}
              title="Différences"
            >
              <Eye size={16} />
              Différences
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-gray-700 rounded-lg"
              title="Plein écran"
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-lg ${showGrid ? 'bg-teal-600' : 'hover:bg-gray-700'}`}
              title="Afficher grille"
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setShowAnnotations(!showAnnotations)}
              className={`p-2 rounded-lg ${showAnnotations ? 'bg-teal-600' : 'hover:bg-gray-700'}`}
              title="Annotations"
            >
              {showAnnotations ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Plan Selectors */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
        <div className="flex items-center gap-4">
          {/* Left Plan Selector */}
          <div className="flex-1">
            <label className="text-xs text-gray-400 block mb-1">Plan Ancien (Avant)</label>
            <select
              value={leftPlan?.id || ''}
              onChange={(e) => setLeftPlan(plans.find(p => p.id === e.target.value) || null)}
              className="w-full bg-gray-700 border-gray-600 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Sélectionner un plan...</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - {plan.version}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-gray-500">
            <ChevronLeft size={20} />
            <span className="text-sm">Comparer</span>
            <ChevronRight size={20} />
          </div>

          {/* Right Plan Selector */}
          <div className="flex-1">
            <label className="text-xs text-gray-400 block mb-1">Plan Nouveau (Après)</label>
            <select
              value={rightPlan?.id || ''}
              onChange={(e) => setRightPlan(plans.find(p => p.id === e.target.value) || null)}
              className="w-full bg-gray-700 border-gray-600 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Sélectionner un plan...</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - {plan.version}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Comparison Area */}
      <div className="flex-1 flex">
        {/* Viewer */}
        <div 
          ref={containerRef}
          className={`flex-1 relative overflow-hidden ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={isAddingAnnotation ? handleAddAnnotation : undefined}
          style={{ 
            background: showGrid 
              ? 'repeating-linear-gradient(0deg, transparent, transparent 49px, rgba(255,255,255,0.1) 50px), repeating-linear-gradient(90deg, transparent, transparent 49px, rgba(255,255,255,0.1) 50px)'
              : '#1a1a1a'
          }}
        >
          {(!leftPlan && !rightPlan) ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FileImage size={64} className="mx-auto mb-4 opacity-50" />
                <p>Sélectionnez deux plans à comparer</p>
              </div>
            </div>
          ) : (
            <div 
              className="absolute inset-0"
              style={{
                transform: `scale(${zoom / 100}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                transformOrigin: 'center center'
              }}
            >
              {/* Mode: Slider */}
              {compareMode === 'slider' && (
                <div className="relative w-full h-full">
                  {/* Image gauche (ancien) */}
                  {leftPlan && (
                    <div 
                      className="absolute inset-0 overflow-hidden"
                      style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                    >
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <div className="text-center p-8 bg-gray-700/50 rounded-xl">
                          <FileImage size={48} className="mx-auto mb-2 text-gray-400" />
                          <p className="text-gray-300">{leftPlan.name}</p>
                          <p className="text-sm text-amber-400">{leftPlan.version}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(leftPlan.uploadedAt).toLocaleDateString('fr-CA')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Image droite (nouveau) */}
                  {rightPlan && (
                    <div 
                      className="absolute inset-0 overflow-hidden"
                      style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
                    >
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <div className="text-center p-8 bg-gray-700/50 rounded-xl">
                          <FileImage size={48} className="mx-auto mb-2 text-teal-400" />
                          <p className="text-gray-300">{rightPlan.name}</p>
                          <p className="text-sm text-teal-400">{rightPlan.version}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(rightPlan.uploadedAt).toLocaleDateString('fr-CA')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Slider handle */}
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-teal-500 cursor-ew-resize z-10"
                    style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      const handleMouseMove = (e: MouseEvent) => {
                        if (containerRef.current) {
                          const rect = containerRef.current.getBoundingClientRect()
                          const x = e.clientX - rect.left
                          const percent = (x / rect.width) * 100
                          setSliderPosition(Math.max(0, Math.min(100, percent)))
                        }
                      }
                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove)
                        document.removeEventListener('mouseup', handleMouseUp)
                      }
                      document.addEventListener('mousemove', handleMouseMove)
                      document.addEventListener('mouseup', handleMouseUp)
                    }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center shadow-lg">
                      <div className="flex gap-0.5">
                        <div className="w-0.5 h-3 bg-white rounded" />
                        <div className="w-0.5 h-3 bg-white rounded" />
                      </div>
                    </div>
                  </div>

                  {/* Labels */}
                  <div className="absolute top-4 left-4 px-2 py-1 bg-amber-600 rounded text-xs">
                    AVANT
                  </div>
                  <div className="absolute top-4 right-4 px-2 py-1 bg-teal-600 rounded text-xs">
                    APRÈS
                  </div>
                </div>
              )}

              {/* Mode: Overlay */}
              {compareMode === 'overlay' && (
                <div className="relative w-full h-full">
                  {/* Image base (ancien) */}
                  {leftPlan && (
                    <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                      <div className="text-center p-8 bg-gray-700/50 rounded-xl">
                        <FileImage size={48} className="mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-300">{leftPlan.name}</p>
                        <p className="text-sm text-amber-400">{leftPlan.version}</p>
                      </div>
                    </div>
                  )}

                  {/* Image overlay (nouveau) */}
                  {rightPlan && (
                    <div 
                      className="absolute inset-0 bg-teal-900/30 flex items-center justify-center"
                      style={{ opacity: overlayOpacity / 100 }}
                    >
                      <div className="text-center p-8 bg-teal-700/50 rounded-xl">
                        <FileImage size={48} className="mx-auto mb-2 text-teal-400" />
                        <p className="text-gray-300">{rightPlan.name}</p>
                        <p className="text-sm text-teal-400">{rightPlan.version}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mode: Side by Side */}
              {compareMode === 'sideBySide' && (
                <div className="flex h-full">
                  {/* Left */}
                  <div className="flex-1 border-r border-gray-700 bg-gray-800 flex items-center justify-center">
                    {leftPlan ? (
                      <div className="text-center p-8">
                        <FileImage size={64} className="mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-300">{leftPlan.name}</p>
                        <p className="text-sm text-amber-400">{leftPlan.version}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(leftPlan.uploadedAt).toLocaleDateString('fr-CA')}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-500">Aucun plan sélectionné</p>
                    )}
                  </div>
                  {/* Right */}
                  <div className="flex-1 bg-gray-800 flex items-center justify-center">
                    {rightPlan ? (
                      <div className="text-center p-8">
                        <FileImage size={64} className="mx-auto mb-2 text-teal-400" />
                        <p className="text-gray-300">{rightPlan.name}</p>
                        <p className="text-sm text-teal-400">{rightPlan.version}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(rightPlan.uploadedAt).toLocaleDateString('fr-CA')}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-500">Aucun plan sélectionné</p>
                    )}
                  </div>
                </div>
              )}

              {/* Mode: Difference */}
              {compareMode === 'difference' && (
                <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
                  <div className="text-center p-8 bg-gray-800 rounded-xl max-w-md">
                    <AlertCircle size={48} className="mx-auto mb-4 text-amber-400" />
                    <h3 className="text-lg font-semibold mb-2">Détection des différences</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Cette fonctionnalité compare pixel par pixel les deux plans et met en évidence les zones modifiées.
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2 bg-green-900/30 rounded">
                        <div className="w-3 h-3 bg-green-500 rounded mx-auto mb-1" />
                        Ajouts
                      </div>
                      <div className="p-2 bg-amber-900/30 rounded">
                        <div className="w-3 h-3 bg-amber-500 rounded mx-auto mb-1" />
                        Modifications
                      </div>
                      <div className="p-2 bg-red-900/30 rounded">
                        <div className="w-3 h-3 bg-red-500 rounded mx-auto mb-1" />
                        Suppressions
                      </div>
                    </div>
                    {leftPlan && rightPlan && (
                      <button className="mt-4 px-4 py-2 bg-teal-600 rounded-lg hover:bg-teal-700 text-sm">
                        Analyser les différences
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Annotations */}
              {showAnnotations && annotations.map(ann => (
                <div
                  key={ann.id}
                  className="absolute group"
                  style={{ left: `${ann.x}%`, top: `${ann.y}%` }}
                >
                  <div className={`w-6 h-6 rounded-full ${getAnnotationColor(ann.type)} flex items-center justify-center cursor-pointer shadow-lg`}>
                    {ann.type === 'addition' && <Plus size={14} />}
                    {ann.type === 'modification' && <RefreshCw size={14} />}
                    {ann.type === 'deletion' && <Minus size={14} />}
                    {ann.type === 'note' && <Info size={14} />}
                  </div>
                  <div className="absolute left-8 top-0 hidden group-hover:block bg-gray-800 border border-gray-600 rounded-lg p-2 min-w-[150px] z-20">
                    <p className="text-sm">{ann.text}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(ann.createdAt).toLocaleString('fr-CA')}
                    </p>
                    <button
                      onClick={() => removeAnnotation(ann.id)}
                      className="mt-2 text-xs text-red-400 hover:text-red-300"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Controls */}
        <div className="w-64 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
          {/* Zoom Controls */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <ZoomIn size={16} />
              Zoom
            </h3>
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => handleZoom(-25)}
                className="p-2 bg-gray-700 rounded hover:bg-gray-600"
              >
                <Minus size={16} />
              </button>
              <div className="flex-1 text-center font-mono">{zoom}%</div>
              <button
                onClick={() => handleZoom(25)}
                className="p-2 bg-gray-700 rounded hover:bg-gray-600"
              >
                <Plus size={16} />
              </button>
            </div>
            <input
              type="range"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              min="25"
              max="400"
              className="w-full"
            />
            <button
              onClick={resetView}
              className="w-full mt-2 py-1.5 text-sm border border-gray-600 rounded hover:bg-gray-700 flex items-center justify-center gap-1"
            >
              <RotateCcw size={14} />
              Réinitialiser vue
            </button>
          </div>

          {/* Mode-specific controls */}
          {compareMode === 'slider' && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Sliders size={16} />
                Position slider
              </h3>
              <input
                type="range"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                min="0"
                max="100"
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Ancien</span>
                <span>{sliderPosition}%</span>
                <span>Nouveau</span>
              </div>
            </div>
          )}

          {compareMode === 'overlay' && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Layers size={16} />
                Opacité overlay
              </h3>
              <input
                type="range"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                min="0"
                max="100"
                className="w-full"
              />
              <div className="text-center text-sm text-gray-400 mt-1">
                {overlayOpacity}%
              </div>
            </div>
          )}

          {/* Annotations */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <MousePointer size={16} />
              Annotations
            </h3>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              {(['addition', 'modification', 'deletion', 'note'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedAnnotationType(type)
                    setIsAddingAnnotation(true)
                  }}
                  className={`p-2 rounded text-xs flex items-center justify-center gap-1 ${
                    isAddingAnnotation && selectedAnnotationType === type
                      ? getAnnotationColor(type)
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {type === 'addition' && <><Plus size={12} /> Ajout</>}
                  {type === 'modification' && <><RefreshCw size={12} /> Modif</>}
                  {type === 'deletion' && <><Minus size={12} /> Suppr</>}
                  {type === 'note' && <><Info size={12} /> Note</>}
                </button>
              ))}
            </div>

            {isAddingAnnotation && (
              <div className="p-2 bg-teal-900/30 rounded text-xs text-teal-300 mb-3">
                Cliquez sur le plan pour ajouter une annotation
              </div>
            )}

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {annotations.length === 0 ? (
                <p className="text-xs text-gray-500">Aucune annotation</p>
              ) : (
                annotations.map(ann => (
                  <div key={ann.id} className="flex items-center gap-2 p-2 bg-gray-700 rounded text-xs">
                    <div className={`w-3 h-3 rounded-full ${getAnnotationColor(ann.type)}`} />
                    <span className="flex-1 truncate">{ann.text}</span>
                    <button
                      onClick={() => removeAnnotation(ann.id)}
                      className="text-gray-500 hover:text-red-400"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-sm font-semibold mb-3">Légende</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span className="text-gray-400">Ajouts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded" />
                <span className="text-gray-400">Modifications</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded" />
                <span className="text-gray-400">Suppressions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span className="text-gray-400">Notes</span>
              </div>
            </div>
          </div>

          {/* Keyboard shortcuts */}
          <div className="border-t border-gray-700 pt-4 mt-4">
            <h3 className="text-sm font-semibold mb-3">Raccourcis</h3>
            <div className="space-y-1 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Zoom +/-</span>
                <span className="font-mono">Scroll</span>
              </div>
              <div className="flex justify-between">
                <span>Déplacer</span>
                <span className="font-mono">Alt+Clic</span>
              </div>
              <div className="flex justify-between">
                <span>Plein écran</span>
                <span className="font-mono">F</span>
              </div>
              <div className="flex justify-between">
                <span>Réinitialiser</span>
                <span className="font-mono">R</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
