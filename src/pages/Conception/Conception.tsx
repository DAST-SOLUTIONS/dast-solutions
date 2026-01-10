/**
 * DAST Solutions - Module Conception
 * Phase de conception de projet
 * 
 * Fonctionnalités:
 * - Viewer de plans 2D/3D
 * - Gestion des documents de conception
 * - Notes et annotations
 * - Coordination des disciplines
 * - Revue de conception
 */
import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, FileText, FolderOpen, Plus, Search, Eye, Download,
  Upload, Trash2, Edit2, MessageSquare, CheckCircle2, AlertTriangle,
  Clock, Users, Calendar, Filter, LayoutGrid, List, MoreVertical,
  ChevronRight, ChevronDown, Maximize2, ZoomIn, ZoomOut, RotateCw,
  Layers, Box, Ruler, Pencil, Tag, Star, Share2, Lock, Unlock,
  GitBranch, FileCheck, AlertCircle, Settings, RefreshCw, PanelLeft,
  Image, File, FileSpreadsheet, Video, Archive, Building2, Compass,
  PenTool, MousePointer, Move, Hash, Square, Circle
} from 'lucide-react'

// Types
interface ConceptionDocument {
  id: string
  project_id: string
  name: string
  discipline: string
  type: 'plan' | 'specification' | 'detail' | 'schedule' | 'report' | 'model'
  file_url: string
  file_type: string
  file_size: number
  version: string
  status: 'draft' | 'for_review' | 'approved' | 'revision_required'
  created_by: string
  created_at: string
  updated_at: string
  annotations: DocumentAnnotation[]
  comments: DocumentComment[]
}

interface DocumentAnnotation {
  id: string
  type: 'note' | 'markup' | 'dimension' | 'cloud' | 'callout'
  content: string
  position: { x: number; y: number }
  color: string
  created_by: string
  created_at: string
}

interface DocumentComment {
  id: string
  content: string
  author: string
  created_at: string
  replies: DocumentComment[]
  resolved: boolean
}

interface ReviewItem {
  id: string
  document_id: string
  type: 'comment' | 'issue' | 'approval'
  content: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assigned_to?: string
  due_date?: string
  created_at: string
}

interface Discipline {
  code: string
  name: string
  color: string
  icon: React.ElementType
}

// Disciplines
const DISCIPLINES: Discipline[] = [
  { code: 'A', name: 'Architecture', color: '#3b82f6', icon: Building2 },
  { code: 'S', name: 'Structure', color: '#ef4444', icon: Box },
  { code: 'M', name: 'Mécanique', color: '#22c55e', icon: Settings },
  { code: 'E', name: 'Électricité', color: '#f59e0b', icon: Compass },
  { code: 'P', name: 'Plomberie', color: '#6366f1', icon: Compass },
  { code: 'C', name: 'Civil', color: '#8b5cf6', icon: Compass },
]

// Types de documents
const DOCUMENT_TYPES = [
  { value: 'plan', label: 'Plan', icon: FileText },
  { value: 'specification', label: 'Devis', icon: FileSpreadsheet },
  { value: 'detail', label: 'Détail', icon: Maximize2 },
  { value: 'schedule', label: 'Tableau', icon: LayoutGrid },
  { value: 'report', label: 'Rapport', icon: File },
  { value: 'model', label: 'Modèle 3D', icon: Box },
]

export default function Conception() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const viewerRef = useRef<HTMLDivElement>(null)
  
  // États
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<ConceptionDocument[]>([])
  const [selectedDoc, setSelectedDoc] = useState<ConceptionDocument | null>(null)
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  
  // Filtres
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDiscipline, setFilterDiscipline] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  
  // Interface
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')
  const [showViewer, setShowViewer] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [activeTab, setActiveTab] = useState<'documents' | 'reviews' | 'coordination'>('documents')
  
  // Viewer
  const [viewerZoom, setViewerZoom] = useState(100)
  const [viewerTool, setViewerTool] = useState<'select' | 'pan' | 'annotate' | 'measure'>('select')
  
  // Upload
  const [uploadForm, setUploadForm] = useState({
    name: '',
    discipline: 'A',
    type: 'plan',
    version: '1.0',
    files: [] as File[]
  })

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    issues: 0
  })

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Charger les documents
      const { data: docsData } = await supabase
        .from('conception_documents')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      setDocuments(docsData || [])

      // Charger les revues
      const { data: reviewsData } = await supabase
        .from('conception_reviews')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      setReviews(reviewsData || [])

      // Stats
      const docs = docsData || []
      setStats({
        total: docs.length,
        approved: docs.filter(d => d.status === 'approved').length,
        pending: docs.filter(d => d.status === 'for_review').length,
        issues: (reviewsData || []).filter(r => r.status === 'open' && r.type === 'issue').length
      })

    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredDocuments = documents.filter(doc => {
    if (searchQuery && !doc.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterDiscipline && doc.discipline !== filterDiscipline) return false
    if (filterType && doc.type !== filterType) return false
    if (filterStatus && doc.status !== filterStatus) return false
    return true
  })

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      setUploadForm({ ...uploadForm, files: Array.from(files) })
    }
  }

  const handleUpload = async () => {
    if (uploadForm.files.length === 0) return
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    for (const file of uploadForm.files) {
      const fileName = `${projectId}/conception/${Date.now()}_${file.name}`
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file)

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(fileName)

        await supabase.from('conception_documents').insert({
          project_id: projectId,
          name: uploadForm.name || file.name,
          discipline: uploadForm.discipline,
          type: uploadForm.type,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          version: uploadForm.version,
          status: 'draft',
          created_by: user.email
        })
      }
    }

    setShowUploadModal(false)
    setUploadForm({ name: '', discipline: 'A', type: 'plan', version: '1.0', files: [] })
    loadData()
  }

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Brouillon' },
      for_review: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'En révision' },
      approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approuvé' },
      revision_required: { bg: 'bg-red-100', text: 'text-red-700', label: 'Révision requise' }
    }
    const config = configs[status] || configs.draft
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const getDisciplineInfo = (code: string) => {
    return DISCIPLINES.find(d => d.code === code) || DISCIPLINES[0]
  }

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return FileText
    if (type.includes('dwg') || type.includes('dxf')) return Compass
    if (type.includes('ifc') || type.includes('rvt')) return Box
    if (type.includes('image')) return Image
    if (type.includes('video')) return Video
    return File
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <PenTool className="text-purple-600" size={24} />
              Phase Conception
            </h1>
            <p className="text-sm text-gray-500">Gestion des documents et coordination</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Stats */}
          <div className="hidden md:flex items-center gap-4 mr-4 text-sm">
            <div className="flex items-center gap-1">
              <FileText size={14} className="text-gray-400" />
              <span>{stats.total} documents</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 size={14} className="text-green-500" />
              <span>{stats.approved} approuvés</span>
            </div>
            {stats.issues > 0 && (
              <div className="flex items-center gap-1 text-red-600">
                <AlertCircle size={14} />
                <span>{stats.issues} problèmes</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <Upload size={16} />
            Importer
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b px-4">
        <div className="flex gap-1">
          {[
            { id: 'documents', label: 'Documents', icon: FileText },
            { id: 'reviews', label: 'Revue de conception', icon: GitBranch },
            { id: 'coordination', label: 'Coordination', icon: Users },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-px transition ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar avec filtres */}
        {showSidebar && activeTab === 'documents' && (
          <div className="w-64 bg-white border-r p-4 overflow-y-auto">
            <div className="space-y-4">
              {/* Recherche */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
                />
              </div>

              {/* Filtre par discipline */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">DISCIPLINE</label>
                <div className="space-y-1">
                  <button
                    onClick={() => setFilterDiscipline('')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                      !filterDiscipline ? 'bg-purple-50 text-purple-700' : 'hover:bg-gray-50'
                    }`}
                  >
                    Toutes
                  </button>
                  {DISCIPLINES.map(disc => (
                    <button
                      key={disc.code}
                      onClick={() => setFilterDiscipline(disc.code)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                        filterDiscipline === disc.code ? 'bg-purple-50 text-purple-700' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: disc.color }}
                      />
                      {disc.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtre par type */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">TYPE</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">Tous les types</option>
                  {DOCUMENT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* Filtre par statut */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">STATUT</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">Tous les statuts</option>
                  <option value="draft">Brouillon</option>
                  <option value="for_review">En révision</option>
                  <option value="approved">Approuvé</option>
                  <option value="revision_required">Révision requise</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Contenu principal */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'documents' && (
            <>
              {/* Toolbar */}
              <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <PanelLeft size={18} />
                  </button>
                  <span className="text-sm text-gray-500">
                    {filteredDocuments.length} document{filteredDocuments.length > 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>

              {/* Documents */}
              <div className="flex-1 overflow-y-auto p-4">
                {filteredDocuments.length === 0 ? (
                  <div className="text-center py-12">
                    <FolderOpen className="mx-auto mb-3 text-gray-300" size={64} />
                    <p className="text-gray-500">Aucun document</p>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="mt-3 text-purple-600 hover:underline"
                    >
                      Importer des documents
                    </button>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredDocuments.map(doc => {
                      const disc = getDisciplineInfo(doc.discipline)
                      const FileIcon = getFileIcon(doc.file_type)
                      
                      return (
                        <div
                          key={doc.id}
                          onClick={() => { setSelectedDoc(doc); setShowViewer(true) }}
                          className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition cursor-pointer group"
                        >
                          {/* Preview */}
                          <div className="h-32 bg-gray-100 flex items-center justify-center relative">
                            <FileIcon size={48} className="text-gray-300" />
                            <div 
                              className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: disc.color }}
                            >
                              {disc.code}
                            </div>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
                              <Eye className="text-white opacity-0 group-hover:opacity-100 transition" size={24} />
                            </div>
                          </div>
                          
                          {/* Info */}
                          <div className="p-3">
                            <h4 className="font-medium text-sm truncate">{doc.name}</h4>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-400">v{doc.version}</span>
                              {getStatusBadge(doc.status)}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Nom</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Discipline</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Type</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Version</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Taille</th>
                          <th className="text-center py-3 px-4 text-xs font-medium text-gray-500">Statut</th>
                          <th className="text-center py-3 px-4 text-xs font-medium text-gray-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredDocuments.map(doc => {
                          const disc = getDisciplineInfo(doc.discipline)
                          const FileIcon = getFileIcon(doc.file_type)
                          const typeInfo = DOCUMENT_TYPES.find(t => t.value === doc.type)
                          
                          return (
                            <tr key={doc.id} className="hover:bg-gray-50">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <FileIcon size={20} className="text-gray-400" />
                                  <span className="font-medium">{doc.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <span 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: disc.color }}
                                  />
                                  <span className="text-sm">{disc.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm">{typeInfo?.label || doc.type}</td>
                              <td className="py-3 px-4 text-sm">v{doc.version}</td>
                              <td className="py-3 px-4 text-sm text-gray-500">{formatFileSize(doc.file_size)}</td>
                              <td className="py-3 px-4 text-center">{getStatusBadge(doc.status)}</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center justify-center gap-1">
                                  <button 
                                    onClick={() => { setSelectedDoc(doc); setShowViewer(true) }}
                                    className="p-1.5 hover:bg-gray-100 rounded"
                                  >
                                    <Eye size={16} className="text-gray-500" />
                                  </button>
                                  <button className="p-1.5 hover:bg-gray-100 rounded">
                                    <Download size={16} className="text-gray-500" />
                                  </button>
                                  <button className="p-1.5 hover:bg-gray-100 rounded">
                                    <MoreVertical size={16} className="text-gray-500" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Onglet Revue */}
          {activeTab === 'reviews' && (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl border p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <GitBranch className="text-purple-600" size={20} />
                    Revue de conception
                  </h3>
                  
                  {reviews.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      Aucun élément de revue
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map(review => (
                        <div key={review.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{review.content}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                {new Date(review.created_at).toLocaleDateString('fr-CA')}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              review.status === 'open' ? 'bg-red-100 text-red-700' :
                              review.status === 'resolved' ? 'bg-green-100 text-green-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {review.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Onglet Coordination */}
          {activeTab === 'coordination' && (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl border p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Users className="text-purple-600" size={20} />
                    Coordination des disciplines
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {DISCIPLINES.map(disc => {
                      const discDocs = documents.filter(d => d.discipline === disc.code)
                      
                      return (
                        <div 
                          key={disc.code}
                          className="p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: disc.color }}
                            />
                            <span className="font-medium">{disc.name}</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            <p>{discDocs.length} documents</p>
                            <p>{discDocs.filter(d => d.status === 'approved').length} approuvés</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Viewer Panel */}
        {showViewer && selectedDoc && (
          <div className="w-1/2 bg-white border-l flex flex-col">
            {/* Viewer Header */}
            <div className="p-3 border-b flex items-center justify-between">
              <div>
                <h4 className="font-medium">{selectedDoc.name}</h4>
                <p className="text-xs text-gray-500">v{selectedDoc.version}</p>
              </div>
              <button 
                onClick={() => { setShowViewer(false); setSelectedDoc(null) }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                ✕
              </button>
            </div>
            
            {/* Viewer Toolbar */}
            <div className="p-2 border-b flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setViewerTool('select')}
                  className={`p-2 rounded ${viewerTool === 'select' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                >
                  <MousePointer size={16} />
                </button>
                <button 
                  onClick={() => setViewerTool('pan')}
                  className={`p-2 rounded ${viewerTool === 'pan' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                >
                  <Move size={16} />
                </button>
                <button 
                  onClick={() => setViewerTool('annotate')}
                  className={`p-2 rounded ${viewerTool === 'annotate' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                >
                  <Pencil size={16} />
                </button>
                <button 
                  onClick={() => setViewerTool('measure')}
                  className={`p-2 rounded ${viewerTool === 'measure' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                >
                  <Ruler size={16} />
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <button onClick={() => setViewerZoom(Math.max(25, viewerZoom - 25))} className="p-1">
                  <ZoomOut size={16} />
                </button>
                <span className="text-sm w-12 text-center">{viewerZoom}%</span>
                <button onClick={() => setViewerZoom(Math.min(400, viewerZoom + 25))} className="p-1">
                  <ZoomIn size={16} />
                </button>
              </div>
            </div>
            
            {/* Viewer Content */}
            <div 
              ref={viewerRef}
              className="flex-1 bg-gray-100 overflow-auto flex items-center justify-center"
            >
              {selectedDoc.file_type?.includes('pdf') ? (
                <iframe
                  src={selectedDoc.file_url}
                  className="w-full h-full"
                  style={{ transform: `scale(${viewerZoom / 100})` }}
                />
              ) : selectedDoc.file_type?.includes('image') ? (
                <img 
                  src={selectedDoc.file_url} 
                  alt={selectedDoc.name}
                  style={{ transform: `scale(${viewerZoom / 100})` }}
                />
              ) : (
                <div className="text-center text-gray-500">
                  <FileText size={64} className="mx-auto mb-2 opacity-50" />
                  <p>Prévisualisation non disponible</p>
                  <a 
                    href={selectedDoc.file_url} 
                    target="_blank"
                    className="text-purple-600 hover:underline text-sm mt-2 inline-block"
                  >
                    Télécharger le fichier
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">Importer des documents</h2>
              <button onClick={() => setShowUploadModal(false)} className="p-1 hover:bg-gray-100 rounded">✕</button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom du document</label>
                <input
                  type="text"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({...uploadForm, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Optionnel - sinon nom du fichier"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Discipline</label>
                  <select
                    value={uploadForm.discipline}
                    onChange={(e) => setUploadForm({...uploadForm, discipline: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {DISCIPLINES.map(d => (
                      <option key={d.code} value={d.code}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={uploadForm.type}
                    onChange={(e) => setUploadForm({...uploadForm, type: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {DOCUMENT_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Fichiers</label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="conception-upload"
                  />
                  <label htmlFor="conception-upload" className="cursor-pointer">
                    <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                    <p className="text-sm text-gray-600">
                      Cliquez ou glissez vos fichiers
                    </p>
                  </label>
                </div>
                {uploadForm.files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {uploadForm.files.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
                        <FileText size={14} className="text-gray-400" />
                        <span className="flex-1 truncate">{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}
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
                onClick={handleUpload}
                disabled={uploadForm.files.length === 0}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
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
