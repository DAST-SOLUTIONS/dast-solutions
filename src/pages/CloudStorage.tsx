/**
 * DAST Solutions - Cloud Storage
 * Gestion documents projet avec versions, preview et partage
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { PageTitle } from '@/components/PageTitle'
import { Search, Upload, FolderPlus, File, FileText, Image, FileArchive, Film, Music, Folder, MoreVertical, Download, Trash2, Share2, Eye, Clock, Star, StarOff, Grid, List, ChevronRight, X, Plus, Edit, Copy, Move, Info, Lock, Users, Link, CheckCircle, AlertCircle, HardDrive, Cloud } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface FileItem {
  id: string; name: string; type: 'file' | 'folder'; mimeType?: string; size?: number
  parentId: string | null; projectId?: string; createdAt: string; updatedAt: string
  createdBy: string; versions?: { id: string; version: number; size: number; createdAt: string }[]
  isStarred: boolean; isShared: boolean; sharedWith?: string[]; tags?: string[]
}

const FILE_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  'folder': { icon: Folder, color: 'text-amber-500' },
  'application/pdf': { icon: FileText, color: 'text-red-500' },
  'image/': { icon: Image, color: 'text-green-500' },
  'video/': { icon: Film, color: 'text-purple-500' },
  'audio/': { icon: Music, color: 'text-pink-500' },
  'application/zip': { icon: FileArchive, color: 'text-amber-600' },
  'default': { icon: File, color: 'text-blue-500' }
}

const DEMO_FILES: FileItem[] = [
  { id: 'f1', name: 'Projets 2024', type: 'folder', parentId: null, createdAt: '2024-01-15', updatedAt: '2024-12-10', createdBy: 'Danny', isStarred: true, isShared: false },
  { id: 'f2', name: 'Modèles', type: 'folder', parentId: null, createdAt: '2024-03-01', updatedAt: '2024-11-20', createdBy: 'Danny', isStarred: false, isShared: true, sharedWith: ['equipe@dast.ca'] },
  { id: 'f3', name: 'Archives', type: 'folder', parentId: null, createdAt: '2023-06-10', updatedAt: '2024-08-15', createdBy: 'Danny', isStarred: false, isShared: false },
  { id: 'd1', name: 'Devis Centre Sportif.pdf', type: 'file', mimeType: 'application/pdf', size: 15728640, parentId: 'f1', projectId: 'p1', createdAt: '2024-12-01', updatedAt: '2024-12-10', createdBy: 'Danny', versions: [{ id: 'v1', version: 1, size: 14500000, createdAt: '2024-12-01' }, { id: 'v2', version: 2, size: 15728640, createdAt: '2024-12-10' }], isStarred: true, isShared: true, tags: ['devis', 'sportif'] },
  { id: 'd2', name: 'Plans architecturaux.dwg', type: 'file', mimeType: 'application/dwg', size: 45875200, parentId: 'f1', projectId: 'p1', createdAt: '2024-11-28', updatedAt: '2024-12-05', createdBy: 'Danny', isStarred: false, isShared: false, tags: ['plans', 'dwg'] },
  { id: 'd3', name: 'Photo chantier 001.jpg', type: 'file', mimeType: 'image/jpeg', size: 3145728, parentId: 'f1', createdAt: '2024-12-08', updatedAt: '2024-12-08', createdBy: 'Danny', isStarred: false, isShared: false },
  { id: 'd4', name: 'Contrat type.docx', type: 'file', mimeType: 'application/docx', size: 524288, parentId: 'f2', createdAt: '2024-03-15', updatedAt: '2024-09-20', createdBy: 'Danny', versions: [{ id: 'v1', version: 1, size: 480000, createdAt: '2024-03-15' }, { id: 'v2', version: 2, size: 510000, createdAt: '2024-06-10' }, { id: 'v3', version: 3, size: 524288, createdAt: '2024-09-20' }], isStarred: true, isShared: true, tags: ['contrat', 'modele'] },
  { id: 'd5', name: 'Bordereau estimation.xlsx', type: 'file', mimeType: 'application/xlsx', size: 1048576, parentId: 'f2', createdAt: '2024-04-01', updatedAt: '2024-11-15', createdBy: 'Danny', isStarred: false, isShared: true, tags: ['bordereau', 'estimation'] },
]

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB'
  return (bytes / 1073741824).toFixed(1) + ' GB'
}

function getFileIcon(item: FileItem) {
  if (item.type === 'folder') return FILE_ICONS['folder']
  const mime = item.mimeType || ''
  for (const [key, value] of Object.entries(FILE_ICONS)) {
    if (mime.startsWith(key) || mime === key) return value
  }
  return FILE_ICONS['default']
}

function FileCard({ item, onOpen, onStar, onShare, onDelete, viewMode }: { item: FileItem; onOpen: (i: FileItem) => void; onStar: (id: string) => void; onShare: (i: FileItem) => void; onDelete: (id: string) => void; viewMode: 'grid' | 'list' }) {
  const { icon: Icon, color } = getFileIcon(item)
  const [showMenu, setShowMenu] = useState(false)

  if (viewMode === 'list') {
    return (
      <div className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg group cursor-pointer" onClick={() => onOpen(item)}>
        <Icon size={24} className={color} />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">{item.name}</div>
          <div className="text-xs text-gray-500">{item.type === 'file' && item.size ? formatFileSize(item.size) : '--'}</div>
        </div>
        <div className="text-sm text-gray-500 hidden md:block">{format(new Date(item.updatedAt), 'dd MMM yyyy', { locale: fr })}</div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
          {item.isShared && <Users size={16} className="text-blue-500" />}
          <button onClick={e => { e.stopPropagation(); onStar(item.id) }} className={item.isStarred ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'}><Star size={16} fill={item.isStarred ? 'currentColor' : 'none'} /></button>
          <div className="relative">
            <button onClick={e => { e.stopPropagation(); setShowMenu(!showMenu) }} className="p-1 hover:bg-gray-200 rounded"><MoreVertical size={16} /></button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg py-1 z-10 w-40">
                <button onClick={e => { e.stopPropagation(); onShare(item); setShowMenu(false) }} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"><Share2 size={14} />Partager</button>
                <button onClick={e => { e.stopPropagation(); setShowMenu(false) }} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"><Download size={14} />Télécharger</button>
                <button onClick={e => { e.stopPropagation(); onDelete(item.id); setShowMenu(false) }} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"><Trash2 size={14} />Supprimer</button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition group cursor-pointer" onClick={() => onOpen(item)}>
      <div className="flex justify-between items-start mb-3">
        <div className={`p-3 rounded-lg ${item.type === 'folder' ? 'bg-amber-50' : 'bg-gray-50'}`}><Icon size={32} className={color} /></div>
        <div className="flex items-center gap-1">
          {item.isShared && <Users size={14} className="text-blue-500" />}
          <button onClick={e => { e.stopPropagation(); onStar(item.id) }} className={`p-1 rounded ${item.isStarred ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'}`}><Star size={14} fill={item.isStarred ? 'currentColor' : 'none'} /></button>
        </div>
      </div>
      <h3 className="font-medium text-gray-900 truncate mb-1">{item.name}</h3>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{item.type === 'file' && item.size ? formatFileSize(item.size) : '--'}</span>
        <span>{format(new Date(item.updatedAt), 'dd MMM', { locale: fr })}</span>
      </div>
      {item.versions && item.versions.length > 1 && <div className="mt-2 text-xs text-teal-600 flex items-center gap-1"><Clock size={12} />v{item.versions.length}</div>}
    </div>
  )
}

function FileDetailsModal({ item, isOpen, onClose }: { item: FileItem | null; isOpen: boolean; onClose: () => void }) {
  if (!isOpen || !item) return null
  const { icon: Icon, color } = getFileIcon(item)
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        <div className="bg-gray-50 p-6 border-b">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4"><div className="p-3 bg-white rounded-lg border"><Icon size={32} className={color} /></div><div><h2 className="font-bold text-lg">{item.name}</h2><p className="text-sm text-gray-500">{item.type === 'file' ? formatFileSize(item.size || 0) : 'Dossier'}</p></div></div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded"><X size={20} /></button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Créé le</span><div className="font-medium">{format(new Date(item.createdAt), 'dd MMM yyyy', { locale: fr })}</div></div>
            <div><span className="text-gray-500">Modifié le</span><div className="font-medium">{format(new Date(item.updatedAt), 'dd MMM yyyy', { locale: fr })}</div></div>
            <div><span className="text-gray-500">Créé par</span><div className="font-medium">{item.createdBy}</div></div>
            <div><span className="text-gray-500">Type</span><div className="font-medium">{item.mimeType || 'Dossier'}</div></div>
          </div>
          {item.tags && item.tags.length > 0 && <div><span className="text-sm text-gray-500">Tags</span><div className="flex flex-wrap gap-1 mt-1">{item.tags.map(t => <span key={t} className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded text-xs">{t}</span>)}</div></div>}
          {item.versions && item.versions.length > 0 && (
            <div><span className="text-sm text-gray-500">Historique des versions</span>
              <div className="mt-2 space-y-2">{item.versions.map(v => (
                <div key={v.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2"><Clock size={14} className="text-gray-400" /><span className="font-medium">Version {v.version}</span></div>
                  <div className="flex items-center gap-3"><span className="text-sm text-gray-500">{formatFileSize(v.size)}</span><span className="text-sm text-gray-500">{format(new Date(v.createdAt), 'dd MMM yyyy', { locale: fr })}</span><button className="text-teal-600 hover:text-teal-700"><Download size={14} /></button></div>
                </div>
              ))}</div>
            </div>
          )}
          {item.isShared && item.sharedWith && <div><span className="text-sm text-gray-500">Partagé avec</span><div className="mt-1 space-y-1">{item.sharedWith.map(u => <div key={u} className="flex items-center gap-2 text-sm"><Users size={14} className="text-blue-500" />{u}</div>)}</div></div>}
        </div>
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-100">Fermer</button>
          <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"><Download size={16} />Télécharger</button>
        </div>
      </div>
    </div>
  )
}

export default function CloudStorage() {
  const [files, setFiles] = useState(DEMO_FILES)
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'starred' | 'shared'>('all')
  const [selected, setSelected] = useState<FileItem | null>(null)
  const [breadcrumb, setBreadcrumb] = useState<{ id: string | null; name: string }[]>([{ id: null, name: 'Mes fichiers' }])

  const currentFiles = useMemo(() => {
    let f = files.filter(file => file.parentId === currentFolder)
    if (search) f = f.filter(file => file.name.toLowerCase().includes(search.toLowerCase()))
    if (filter === 'starred') f = f.filter(file => file.isStarred)
    if (filter === 'shared') f = f.filter(file => file.isShared)
    return f.sort((a, b) => (a.type === 'folder' ? -1 : 1) - (b.type === 'folder' ? -1 : 1))
  }, [files, currentFolder, search, filter])

  const stats = useMemo(() => {
    const totalSize = files.filter(f => f.type === 'file').reduce((s, f) => s + (f.size || 0), 0)
    return { total: files.length, folders: files.filter(f => f.type === 'folder').length, files: files.filter(f => f.type === 'file').length, size: totalSize, starred: files.filter(f => f.isStarred).length }
  }, [files])

  const handleOpen = (item: FileItem) => {
    if (item.type === 'folder') {
      setCurrentFolder(item.id)
      setBreadcrumb(prev => [...prev, { id: item.id, name: item.name }])
    } else {
      setSelected(item)
    }
  }

  const handleBreadcrumb = (index: number) => {
    const newBreadcrumb = breadcrumb.slice(0, index + 1)
    setBreadcrumb(newBreadcrumb)
    setCurrentFolder(newBreadcrumb[newBreadcrumb.length - 1].id)
  }

  const toggleStar = (id: string) => setFiles(prev => prev.map(f => f.id === id ? { ...f, isStarred: !f.isStarred } : f))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div><PageTitle title="Cloud Storage" /><p className="text-gray-500 mt-1">Gestion de vos documents et fichiers</p></div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><FolderPlus size={18} />Nouveau dossier</button>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"><Upload size={18} />Importer</button>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 rounded-lg"><HardDrive size={20} className="text-blue-600" /></div><div><div className="text-2xl font-bold">{formatFileSize(stats.size)}</div><div className="text-sm text-gray-500">Utilisé</div></div></div></div>
        <div className="bg-white rounded-xl border p-4"><div className="flex items-center gap-3"><div className="p-2 bg-amber-100 rounded-lg"><Folder size={20} className="text-amber-600" /></div><div><div className="text-2xl font-bold">{stats.folders}</div><div className="text-sm text-gray-500">Dossiers</div></div></div></div>
        <div className="bg-white rounded-xl border p-4"><div className="flex items-center gap-3"><div className="p-2 bg-green-100 rounded-lg"><File size={20} className="text-green-600" /></div><div><div className="text-2xl font-bold">{stats.files}</div><div className="text-sm text-gray-500">Fichiers</div></div></div></div>
        <div className="bg-white rounded-xl border p-4"><div className="flex items-center gap-3"><div className="p-2 bg-purple-100 rounded-lg"><Star size={20} className="text-purple-600" /></div><div><div className="text-2xl font-bold">{stats.starred}</div><div className="text-sm text-gray-500">Favoris</div></div></div></div>
        <div className="bg-white rounded-xl border p-4"><div className="flex items-center gap-3"><div className="p-2 bg-teal-100 rounded-lg"><Cloud size={20} className="text-teal-600" /></div><div><div className="text-2xl font-bold">5 GB</div><div className="text-sm text-gray-500">Disponible</div></div></div></div>
      </div>
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" /></div>
          <div className="flex gap-2">
            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-teal-600 text-white' : 'border hover:bg-gray-50'}`}>Tous</button>
            <button onClick={() => setFilter('starred')} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${filter === 'starred' ? 'bg-teal-600 text-white' : 'border hover:bg-gray-50'}`}><Star size={16} />Favoris</button>
            <button onClick={() => setFilter('shared')} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${filter === 'shared' ? 'bg-teal-600 text-white' : 'border hover:bg-gray-50'}`}><Share2 size={16} />Partagés</button>
          </div>
          <div className="flex border rounded-lg">
            <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}><Grid size={18} /></button>
            <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}><List size={18} /></button>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-4 text-sm">
        {breadcrumb.map((b, i) => (
          <div key={i} className="flex items-center gap-2">
            {i > 0 && <ChevronRight size={14} className="text-gray-400" />}
            <button onClick={() => handleBreadcrumb(i)} className={`hover:text-teal-600 ${i === breadcrumb.length - 1 ? 'font-medium text-gray-900' : 'text-gray-500'}`}>{b.name}</button>
          </div>
        ))}
      </div>
      {currentFiles.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl"><Folder size={48} className="mx-auto text-gray-300 mb-4" /><p className="text-gray-500">Aucun fichier</p></div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">{currentFiles.map(f => <FileCard key={f.id} item={f} onOpen={handleOpen} onStar={toggleStar} onShare={() => {}} onDelete={() => {}} viewMode="grid" />)}</div>
      ) : (
        <div className="bg-white rounded-xl border divide-y">{currentFiles.map(f => <FileCard key={f.id} item={f} onOpen={handleOpen} onStar={toggleStar} onShare={() => {}} onDelete={() => {}} viewMode="list" />)}</div>
      )}
      <FileDetailsModal item={selected} isOpen={!!selected} onClose={() => setSelected(null)} />
    </div>
  )
}
