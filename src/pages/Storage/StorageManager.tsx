/**
 * DAST Solutions - Module Stockage Structuré
 * Gestion du stockage cloud avec:
 * - Business Storage (documents entreprise)
 * - Project Storage (documents par projet)
 * - Gabarits de structure de dossiers
 * - Création manuelle ou via templates
 */
import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, FolderOpen, File, Upload, Download, Trash2, Plus,
  Search, Filter, MoreVertical, LayoutGrid, List, ChevronRight,
  ChevronDown, Edit2, Copy, Move, Star, Share2, Lock, Clock,
  FileText, Image, Video, Archive, FileSpreadsheet, FileCode,
  Folder, FolderPlus, Settings, Check, X, Eye, RefreshCw,
  HardDrive, Building2, Briefcase, FolderTree, Layers,
  Tag, Users, Calendar, Info, ExternalLink
} from 'lucide-react'

// Types
interface StorageItem {
  id: string
  name: string
  type: 'folder' | 'file'
  parent_id: string | null
  path: string
  size?: number
  file_type?: string
  file_url?: string
  is_template: boolean
  is_starred: boolean
  is_shared: boolean
  created_by: string
  created_at: string
  updated_at: string
  children?: StorageItem[]
}

interface FolderTemplate {
  id: string
  name: string
  description: string
  structure: TemplateFolder[]
  category: 'business' | 'project' | 'estimation' | 'gestion'
  is_default: boolean
  created_at: string
}

interface TemplateFolder {
  name: string
  children?: TemplateFolder[]
}

interface StorageStats {
  totalSize: number
  usedSize: number
  filesCount: number
  foldersCount: number
}

// Templates par défaut
const DEFAULT_PROJECT_TEMPLATE: TemplateFolder[] = [
  { name: '01-Administration', children: [
    { name: 'Contrat' },
    { name: 'Correspondance' },
    { name: 'Assurances' },
    { name: 'Permis' }
  ]},
  { name: '02-Plans et devis', children: [
    { name: 'Architecture' },
    { name: 'Structure' },
    { name: 'Mécanique' },
    { name: 'Électricité' },
    { name: 'Civil' },
    { name: 'Addendas' }
  ]},
  { name: '03-Soumissions', children: [
    { name: 'Demandes de prix' },
    { name: 'Prix reçus' },
    { name: 'Tableaux comparatifs' },
    { name: 'Soumission finale' }
  ]},
  { name: '04-Achats', children: [
    { name: 'Bons de commande' },
    { name: 'Contrats sous-traitants' },
    { name: 'Factures fournisseurs' }
  ]},
  { name: '05-Exécution', children: [
    { name: 'Journal de chantier' },
    { name: 'Photos' },
    { name: 'Rapports quotidiens' },
    { name: 'RFI' },
    { name: 'Ordres de changement' }
  ]},
  { name: '06-Qualité', children: [
    { name: 'Inspections' },
    { name: 'Tests et essais' },
    { name: 'Liste de déficiences' }
  ]},
  { name: '07-Clôture', children: [
    { name: 'As-built' },
    { name: 'Manuels O&M' },
    { name: 'Garanties' },
    { name: 'Formation' }
  ]}
]

const DEFAULT_BUSINESS_TEMPLATE: TemplateFolder[] = [
  { name: 'Administration', children: [
    { name: 'Documents légaux' },
    { name: 'Polices assurance' },
    { name: 'Licences RBQ' },
    { name: 'CCQ - Documents' }
  ]},
  { name: 'Ressources humaines', children: [
    { name: 'Employés' },
    { name: 'Formations' },
    { name: 'Politiques' }
  ]},
  { name: 'Marketing', children: [
    { name: 'Portfolio' },
    { name: 'Références' },
    { name: 'Logo et images' }
  ]},
  { name: 'Gabarits', children: [
    { name: 'Soumissions' },
    { name: 'Contrats' },
    { name: 'Lettres' },
    { name: 'Rapports' }
  ]},
  { name: 'Fournisseurs', children: [
    { name: 'Listes de prix' },
    { name: 'Catalogues' },
    { name: 'Contacts' }
  ]}
]

// Composants utilitaires
function FileIcon({ type, size = 20 }: { type?: string; size?: number }) {
  if (!type) return <File size={size} className="text-gray-400" />
  if (type.includes('pdf')) return <FileText size={size} className="text-red-500" />
  if (type.includes('image')) return <Image size={size} className="text-blue-500" />
  if (type.includes('video')) return <Video size={size} className="text-purple-500" />
  if (type.includes('zip') || type.includes('rar')) return <Archive size={size} className="text-amber-500" />
  if (type.includes('sheet') || type.includes('excel')) return <FileSpreadsheet size={size} className="text-green-500" />
  if (type.includes('dwg') || type.includes('cad')) return <FileCode size={size} className="text-cyan-500" />
  return <File size={size} className="text-gray-400" />
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default function StorageManager() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  
  // Détermine le mode (business ou projet)
  const storageMode = projectId ? 'project' : 'business'
  
  // États
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<StorageItem[]>([])
  const [currentFolder, setCurrentFolder] = useState<StorageItem | null>(null)
  const [breadcrumb, setBreadcrumb] = useState<StorageItem[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [templates, setTemplates] = useState<FolderTemplate[]>([])
  
  // Interface
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name')
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  
  // Formulaires
  const [newFolderName, setNewFolderName] = useState('')
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  
  // Stats
  const [stats, setStats] = useState<StorageStats>({
    totalSize: 5 * 1024 * 1024 * 1024, // 5 GB exemple
    usedSize: 0,
    filesCount: 0,
    foldersCount: 0
  })

  useEffect(() => {
    loadData()
  }, [projectId, currentFolder])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Construire la requête selon le mode
      let query = supabase
        .from('storage_items')
        .select('*')
        .eq('user_id', user.id)

      if (storageMode === 'project' && projectId) {
        query = query.eq('project_id', projectId)
      } else {
        query = query.is('project_id', null)
      }

      if (currentFolder) {
        query = query.eq('parent_id', currentFolder.id)
      } else {
        query = query.is('parent_id', null)
      }

      query = query.order('type').order('name')

      const { data: itemsData } = await query
      setItems(itemsData || [])

      // Charger les templates
      const { data: templatesData } = await supabase
        .from('folder_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      setTemplates(templatesData || [])

      // Calculer stats
      const { data: allItems } = await supabase
        .from('storage_items')
        .select('type, size')
        .eq('user_id', user.id)
        .eq(storageMode === 'project' ? 'project_id' : 'project_id', projectId || null)

      if (allItems) {
        const filesCount = allItems.filter(i => i.type === 'file').length
        const foldersCount = allItems.filter(i => i.type === 'folder').length
        const usedSize = allItems.reduce((sum, i) => sum + (i.size || 0), 0)
        setStats({ ...stats, filesCount, foldersCount, usedSize })
      }

    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const navigateToFolder = (folder: StorageItem | null) => {
    if (folder) {
      setBreadcrumb([...breadcrumb, folder])
    } else {
      setBreadcrumb([])
    }
    setCurrentFolder(folder)
    setSelectedItems([])
  }

  const navigateToBreadcrumb = (index: number) => {
    if (index < 0) {
      setBreadcrumb([])
      setCurrentFolder(null)
    } else {
      setBreadcrumb(breadcrumb.slice(0, index + 1))
      setCurrentFolder(breadcrumb[index])
    }
    setSelectedItems([])
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('storage_items').insert({
      user_id: user.id,
      project_id: projectId || null,
      name: newFolderName,
      type: 'folder',
      parent_id: currentFolder?.id || null,
      path: currentFolder ? `${currentFolder.path}/${newFolderName}` : newFolderName,
      is_template: false,
      is_starred: false,
      is_shared: false,
      created_by: user.email
    })

    if (!error) {
      setNewFolderName('')
      setShowCreateFolder(false)
      loadData()
    }
  }

  const handleApplyTemplate = async (template: FolderTemplate) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const createFolders = async (folders: TemplateFolder[], parentId: string | null, basePath: string) => {
      for (const folder of folders) {
        const path = basePath ? `${basePath}/${folder.name}` : folder.name
        
        const { data: newFolder } = await supabase
          .from('storage_items')
          .insert({
            user_id: user.id,
            project_id: projectId || null,
            name: folder.name,
            type: 'folder',
            parent_id: parentId,
            path: path,
            is_template: false,
            is_starred: false,
            is_shared: false,
            created_by: user.email
          })
          .select()
          .single()

        if (newFolder && folder.children) {
          await createFolders(folder.children, newFolder.id, path)
        }
      }
    }

    await createFolders(template.structure, currentFolder?.id || null, currentFolder?.path || '')
    setShowTemplates(false)
    loadData()
  }

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    for (const file of uploadFiles) {
      const filePath = `${user.id}/${storageMode}/${projectId || 'business'}/${currentFolder?.path || ''}/${file.name}`
      
      const { error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(filePath, file)

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('user-files')
          .getPublicUrl(filePath)

        await supabase.from('storage_items').insert({
          user_id: user.id,
          project_id: projectId || null,
          name: file.name,
          type: 'file',
          parent_id: currentFolder?.id || null,
          path: currentFolder ? `${currentFolder.path}/${file.name}` : file.name,
          size: file.size,
          file_type: file.type,
          file_url: publicUrl,
          is_template: false,
          is_starred: false,
          is_shared: false,
          created_by: user.email
        })
      }
    }

    setUploadFiles([])
    setShowUpload(false)
    loadData()
  }

  const handleDelete = async (item: StorageItem) => {
    if (!confirm(`Supprimer "${item.name}" ?`)) return
    
    await supabase.from('storage_items').delete().eq('id', item.id)
    
    if (item.type === 'file' && item.file_url) {
      // Supprimer le fichier du storage
      const path = item.file_url.split('/user-files/')[1]
      if (path) {
        await supabase.storage.from('user-files').remove([path])
      }
    }
    
    loadData()
  }

  const toggleStar = async (item: StorageItem) => {
    await supabase
      .from('storage_items')
      .update({ is_starred: !item.is_starred })
      .eq('id', item.id)
    loadData()
  }

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    // Dossiers en premier
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
    
    switch (sortBy) {
      case 'date':
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      case 'size':
        return (b.size || 0) - (a.size || 0)
      default:
        return a.name.localeCompare(b.name)
    }
  })

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
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
              {storageMode === 'project' ? (
                <>
                  <Briefcase className="text-teal-600" size={24} />
                  Stockage Projet
                </>
              ) : (
                <>
                  <Building2 className="text-blue-600" size={24} />
                  Stockage Business
                </>
              )}
            </h1>
            <p className="text-sm text-gray-500">
              {formatSize(stats.usedSize)} utilisés sur {formatSize(stats.totalSize)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Stats */}
          <div className="hidden md:flex items-center gap-4 mr-4 text-sm text-gray-500">
            <span>{stats.foldersCount} dossiers</span>
            <span>{stats.filesCount} fichiers</span>
          </div>

          <button
            onClick={() => setShowTemplates(true)}
            className="px-3 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
          >
            <Layers size={16} />
            Gabarits
          </button>
          <button
            onClick={() => setShowCreateFolder(true)}
            className="px-3 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
          >
            <FolderPlus size={16} />
            Nouveau dossier
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
          >
            <Upload size={16} />
            Importer
          </button>
        </div>
      </div>

      {/* Usage Bar */}
      <div className="bg-white border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <HardDrive size={16} className="text-gray-400" />
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-teal-500 rounded-full transition-all"
              style={{ width: `${(stats.usedSize / stats.totalSize) * 100}%` }}
            />
          </div>
          <span className="text-sm text-gray-500">
            {Math.round((stats.usedSize / stats.totalSize) * 100)}%
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-sm">
            <button 
              onClick={() => navigateToBreadcrumb(-1)}
              className="hover:text-teal-600 flex items-center gap-1"
            >
              {storageMode === 'project' ? <Briefcase size={14} /> : <Building2 size={14} />}
              Racine
            </button>
            {breadcrumb.map((folder, idx) => (
              <React.Fragment key={folder.id}>
                <ChevronRight size={14} className="text-gray-400" />
                <button
                  onClick={() => navigateToBreadcrumb(idx)}
                  className="hover:text-teal-600"
                >
                  {folder.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 border rounded-lg text-sm w-48"
            />
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 border rounded-lg text-sm"
          >
            <option value="name">Nom</option>
            <option value="date">Date</option>
            <option value="size">Taille</option>
          </select>

          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="mx-auto mb-3 text-gray-300" size={64} />
            <p className="text-gray-500 mb-2">Ce dossier est vide</p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setShowCreateFolder(true)}
                className="text-teal-600 hover:underline text-sm"
              >
                Créer un dossier
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setShowTemplates(true)}
                className="text-teal-600 hover:underline text-sm"
              >
                Utiliser un gabarit
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-lg transition group ${
                  selectedItems.includes(item.id) ? 'ring-2 ring-teal-500' : ''
                }`}
                onClick={() => item.type === 'folder' ? navigateToFolder(item) : null}
                onDoubleClick={() => item.type === 'file' && item.file_url ? window.open(item.file_url) : null}
              >
                <div className="flex items-start justify-between mb-3">
                  {item.type === 'folder' ? (
                    <Folder size={40} className="text-amber-400" />
                  ) : (
                    <FileIcon type={item.file_type} size={40} />
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleStar(item) }}
                    className={`p-1 rounded opacity-0 group-hover:opacity-100 ${
                      item.is_starred ? 'text-amber-500' : 'text-gray-300 hover:text-amber-500'
                    }`}
                  >
                    <Star size={16} fill={item.is_starred ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <h4 className="font-medium text-sm truncate">{item.name}</h4>
                {item.type === 'file' && (
                  <p className="text-xs text-gray-400 mt-1">{formatSize(item.size || 0)}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 w-12"></th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Nom</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Taille</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Modifié</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredItems.map(item => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => item.type === 'folder' ? navigateToFolder(item) : null}
                  >
                    <td className="py-3 px-4">
                      {item.type === 'folder' ? (
                        <Folder size={20} className="text-amber-400" />
                      ) : (
                        <FileIcon type={item.file_type} size={20} />
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        {item.is_starred && <Star size={14} className="text-amber-500" fill="currentColor" />}
                        {item.is_shared && <Share2 size={14} className="text-blue-500" />}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {item.type === 'file' ? formatSize(item.size || 0) : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(item.updated_at).toLocaleDateString('fr-CA')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        {item.type === 'file' && (
                          <>
                            <a 
                              href={item.file_url} 
                              target="_blank"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 hover:bg-gray-100 rounded"
                            >
                              <Eye size={16} className="text-gray-500" />
                            </a>
                            <a 
                              href={item.file_url} 
                              download
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 hover:bg-gray-100 rounded"
                            >
                              <Download size={16} className="text-gray-500" />
                            </a>
                          </>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(item) }}
                          className="p-1.5 hover:bg-gray-100 rounded"
                        >
                          <Trash2 size={16} className="text-gray-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nouveau dossier */}
      {showCreateFolder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold mb-4">Nouveau dossier</h2>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Nom du dossier"
              className="w-full px-3 py-2 border rounded-lg mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => { setShowCreateFolder(false); setNewFolderName('') }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gabarits */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">Gabarits de structure</h2>
              <button onClick={() => setShowTemplates(false)} className="p-1 hover:bg-gray-100 rounded">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {/* Template par défaut projet */}
                <div className="border rounded-xl overflow-hidden">
                  <div className="p-4 bg-teal-50 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        <Briefcase size={18} className="text-teal-600" />
                        Structure projet standard
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Structure complète pour un projet de construction
                      </p>
                    </div>
                    <button
                      onClick={() => handleApplyTemplate({
                        id: 'default-project',
                        name: 'Structure projet standard',
                        description: '',
                        structure: DEFAULT_PROJECT_TEMPLATE,
                        category: 'project',
                        is_default: true,
                        created_at: ''
                      })}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
                    >
                      Appliquer
                    </button>
                  </div>
                  <div className="p-4 bg-gray-50 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      {DEFAULT_PROJECT_TEMPLATE.map((folder, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Folder size={14} className="text-amber-400" />
                          <span>{folder.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Template par défaut business */}
                {storageMode === 'business' && (
                  <div className="border rounded-xl overflow-hidden">
                    <div className="p-4 bg-blue-50 flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          <Building2 size={18} className="text-blue-600" />
                          Structure entreprise standard
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Structure pour documents d'entreprise
                        </p>
                      </div>
                      <button
                        onClick={() => handleApplyTemplate({
                          id: 'default-business',
                          name: 'Structure entreprise standard',
                          description: '',
                          structure: DEFAULT_BUSINESS_TEMPLATE,
                          category: 'business',
                          is_default: true,
                          created_at: ''
                        })}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Appliquer
                      </button>
                    </div>
                    <div className="p-4 bg-gray-50 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        {DEFAULT_BUSINESS_TEMPLATE.map((folder, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Folder size={14} className="text-amber-400" />
                            <span>{folder.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Templates personnalisés */}
                {templates.map(template => (
                  <div key={template.id} className="border rounded-xl overflow-hidden">
                    <div className="p-4 flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{template.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      </div>
                      <button
                        onClick={() => handleApplyTemplate(template)}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                      >
                        Appliquer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Upload */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h2 className="text-lg font-bold mb-4">Importer des fichiers</h2>
            
            <div className="border-2 border-dashed rounded-lg p-6 text-center mb-4">
              <input
                type="file"
                multiple
                onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                className="hidden"
                id="storage-upload"
              />
              <label htmlFor="storage-upload" className="cursor-pointer">
                <Upload className="mx-auto mb-2 text-gray-400" size={40} />
                <p className="text-gray-600">Cliquez ou glissez vos fichiers</p>
              </label>
            </div>

            {uploadFiles.length > 0 && (
              <div className="mb-4 max-h-40 overflow-y-auto space-y-1">
                {uploadFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                    <FileIcon type={file.type} size={16} />
                    <span className="flex-1 truncate">{file.name}</span>
                    <span className="text-gray-400">{formatSize(file.size)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button 
                onClick={() => { setShowUpload(false); setUploadFiles([]) }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleUpload}
                disabled={uploadFiles.length === 0}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                Importer ({uploadFiles.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
