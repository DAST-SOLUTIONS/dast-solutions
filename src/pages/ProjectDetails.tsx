/**
 * DAST Solutions - Project Details COMPLET
 * Avec onglets: Aperçu, Documents, Estimation, Gestion, Finances
 */
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, Save, Loader2, MapPin, Calendar, DollarSign, User, FileText, 
  Ruler, Receipt, ChevronRight, Calculator, Building2, Users,
  FolderOpen, TrendingUp, Clock, Upload, Image, Plus,
  AlertTriangle, CheckCircle, PauseCircle, Edit, Eye, Trash2,
  ClipboardList, Wrench, FileCheck, Target, Layers, PiggyBank
} from 'lucide-react'

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface Project {
  id: string
  name: string
  description?: string
  status: string
  client_id?: string
  client_name?: string
  address?: string
  city?: string
  province?: string
  postal_code?: string
  budget?: number
  start_date?: string
  end_date?: string
  project_type?: string
  project_scope?: string
  building_type?: string
  is_public?: boolean
  created_at: string
  updated_at: string
}

interface ProjectStats {
  soumissions: number
  soumissionsAccepted: number
  factures: number
  facturesUnpaid: number
  measures: number
  totalRevenue: number
  totalBudget: number
  ordresChangement: number
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Brouillon', color: 'bg-gray-100 text-gray-700' },
  { value: 'planning', label: 'Planification', color: 'bg-blue-100 text-blue-700' },
  { value: 'active', label: 'En cours', color: 'bg-green-100 text-green-700' },
  { value: 'on_hold', label: 'En pause', color: 'bg-amber-100 text-amber-700' },
  { value: 'completed', label: 'Terminé', color: 'bg-teal-100 text-teal-700' },
  { value: 'cancelled', label: 'Annulé', color: 'bg-red-100 text-red-700' }
]

const PROJECT_TYPES = [
  { value: 'prive', label: 'Privé' },
  { value: 'public', label: 'Public' }
]

const PROJECT_SCOPES = [
  { value: 'neuf', label: 'Construction neuve' },
  { value: 'renovation', label: 'Rénovation' },
  { value: 'agrandissement', label: 'Agrandissement' },
  { value: 'transformation', label: 'Transformation' },
  { value: 'demolition', label: 'Démolition' },
  { value: 'entretien', label: 'Entretien / Réparation' }
]

const BUILDING_TYPES = [
  { value: 'residence_unifamiliale', label: 'Résidence unifamiliale' },
  { value: 'residence_multifamiliale', label: 'Résidence multifamiliale' },
  { value: 'condo', label: 'Condominium' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'bureau', label: 'Bureau' },
  { value: 'industriel', label: 'Industriel' },
  { value: 'entrepot', label: 'Entrepôt' },
  { value: 'ecole_primaire', label: 'École primaire' },
  { value: 'ecole_secondaire', label: 'École secondaire' },
  { value: 'cegep', label: 'Cégep' },
  { value: 'universite', label: 'Université' },
  { value: 'hopital', label: 'Hôpital' },
  { value: 'clinique', label: 'Clinique médicale' },
  { value: 'chsld', label: 'CHSLD' },
  { value: 'caserne_pompier', label: 'Caserne de pompiers' },
  { value: 'poste_police', label: 'Poste de police' },
  { value: 'edifice_municipal', label: 'Édifice municipal' },
  { value: 'bibliotheque', label: 'Bibliothèque' },
  { value: 'centre_sportif', label: 'Centre sportif' },
  { value: 'arena', label: 'Aréna' },
  { value: 'piscine', label: 'Piscine' },
  { value: 'eglise', label: 'Église' },
  { value: 'autre', label: 'Autre' }
]

const PROVINCES = [
  { value: 'QC', label: 'Québec' },
  { value: 'ON', label: 'Ontario' },
  { value: 'NB', label: 'Nouveau-Brunswick' },
  { value: 'NS', label: 'Nouvelle-Écosse' },
  { value: 'AB', label: 'Alberta' },
  { value: 'BC', label: 'Colombie-Britannique' },
  { value: 'MB', label: 'Manitoba' },
  { value: 'SK', label: 'Saskatchewan' },
  { value: 'PE', label: 'Île-du-Prince-Édouard' },
  { value: 'NL', label: 'Terre-Neuve-et-Labrador' }
]

type TabType = 'apercu' | 'documents' | 'estimation' | 'gestion' | 'finances' | 'edit'

// ============================================================================
// TAB: APERÇU
// ============================================================================

function TabApercu({ project, stats, navigate, projectId }: { 
  project: Project
  stats: ProjectStats
  navigate: (path: string) => void
  projectId: string
}) {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <FileText className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.soumissions}</p>
              <p className="text-sm text-gray-500">Soumissions</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Ruler className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.measures}</p>
              <p className="text-sm text-gray-500">Mesures</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Wrench className="text-amber-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.ordresChangement}</p>
              <p className="text-sm text-gray-500">Ordres chg.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <DollarSign className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {stats.totalRevenue.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-gray-500">Revenus</p>
            </div>
          </div>
        </div>
      </div>

      {/* Budget vs Réel */}
      {project.budget && project.budget > 0 && (
        <div className="bg-white rounded-xl p-6 border">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Target size={18} />
            Budget vs Réel
          </h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">Budget initial</p>
              <p className="text-2xl font-bold text-gray-900">
                {project.budget.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Dépensé</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.totalRevenue.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Restant</p>
              <p className={`text-2xl font-bold ${(project.budget - stats.totalRevenue) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(project.budget - stats.totalRevenue).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
          <div className="mt-4 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${stats.totalRevenue / project.budget > 1 ? 'bg-red-500' : 'bg-teal-500'}`}
              style={{ width: `${Math.min((stats.totalRevenue / project.budget) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div className="grid grid-cols-4 gap-4">
        <button
          onClick={() => navigate(`/takeoff/${projectId}`)}
          className="bg-white rounded-xl p-6 border hover:shadow-lg transition group text-left"
        >
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <Ruler className="text-white" size={28} />
          </div>
          <h3 className="font-semibold">Takeoff</h3>
          <p className="text-sm text-gray-500 mt-1">Relevé de quantités</p>
          <ChevronRight className="text-gray-400 mt-3" size={18} />
        </button>

        <button
          onClick={() => navigate(`/soumissions/nouveau?project=${projectId}`)}
          className="bg-white rounded-xl p-6 border hover:shadow-lg transition group text-left"
        >
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <FileText className="text-white" size={28} />
          </div>
          <h3 className="font-semibold">Soumission</h3>
          <p className="text-sm text-gray-500 mt-1">Créer une soumission</p>
          <ChevronRight className="text-gray-400 mt-3" size={18} />
        </button>

        <button
          onClick={() => navigate(`/takeoff/${projectId}?tab=estimation`)}
          className="bg-white rounded-xl p-6 border hover:shadow-lg transition group text-left"
        >
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <Calculator className="text-white" size={28} />
          </div>
          <h3 className="font-semibold">Estimation</h3>
          <p className="text-sm text-gray-500 mt-1">Coûts et main-d'œuvre</p>
          <ChevronRight className="text-gray-400 mt-3" size={18} />
        </button>

        <button
          onClick={() => navigate(`/factures/nouveau?project=${projectId}`)}
          className="bg-white rounded-xl p-6 border hover:shadow-lg transition group text-left"
        >
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <Receipt className="text-white" size={28} />
          </div>
          <h3 className="font-semibold">Facturation</h3>
          <p className="text-sm text-gray-500 mt-1">Gérer les factures</p>
          <ChevronRight className="text-gray-400 mt-3" size={18} />
        </button>
      </div>

      {/* Informations du projet */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold mb-4">Informations du projet</h3>
        <div className="grid grid-cols-3 gap-6 text-sm">
          <div>
            <p className="text-gray-500">Type</p>
            <p className="font-medium">{PROJECT_TYPES.find(t => t.value === project.project_type)?.label || 'Privé'}</p>
          </div>
          <div>
            <p className="text-gray-500">Portée</p>
            <p className="font-medium">{PROJECT_SCOPES.find(s => s.value === project.project_scope)?.label || '-'}</p>
          </div>
          <div>
            <p className="text-gray-500">Bâtiment</p>
            <p className="font-medium">{BUILDING_TYPES.find(b => b.value === project.building_type)?.label || '-'}</p>
          </div>
          <div>
            <p className="text-gray-500">Adresse</p>
            <p className="font-medium">
              {[project.address, project.city, project.province, project.postal_code].filter(Boolean).join(', ') || '-'}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Budget</p>
            <p className="font-medium">
              {project.budget ? new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(project.budget) : '-'}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Dates</p>
            <p className="font-medium">
              {project.start_date ? new Date(project.start_date).toLocaleDateString('fr-CA') : '-'}
              {project.end_date ? ` → ${new Date(project.end_date).toLocaleDateString('fr-CA')}` : ''}
            </p>
          </div>
        </div>
        {project.description && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-gray-500 text-sm">Description</p>
            <p className="mt-1">{project.description}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// TAB: DOCUMENTS
// ============================================================================

function TabDocuments({ projectId, navigate }: { projectId: string; navigate: (path: string) => void }) {
  const [documents, setDocuments] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Charger les documents
  useEffect(() => {
    loadDocuments()
  }, [projectId])

  const loadDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('project_documents')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false })

      if (!error && data) {
        // Ajouter URLs
        const docsWithUrls = data.map(doc => ({
          ...doc,
          file_url: doc.storage_path ? 
            supabase.storage.from('project-documents').getPublicUrl(doc.storage_path).data?.publicUrl 
            : null
        }))
        setDocuments(docsWithUrls)
      }
    } catch (err) {
      console.error('Erreur chargement:', err)
    }
  }

  const handleUpload = async (files: FileList | null, category: string = 'general') => {
    if (!files?.length) return

    setUploading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      for (const file of Array.from(files)) {
        if (file.size > 50 * 1024 * 1024) {
          setError(`${file.name}: Fichier trop volumineux (max 50MB)`)
          continue
        }

        const timestamp = Date.now()
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const storagePath = `${user.id}/${projectId}/${timestamp}_${sanitizedName}`

        // Upload
        const { error: uploadError } = await supabase.storage
          .from('project-documents')
          .upload(storagePath, file, { cacheControl: '3600', upsert: false })

        if (uploadError) {
          if (uploadError.message.includes('bucket') || uploadError.message.includes('Bucket')) {
            setError('Bucket "project-documents" non créé. Allez dans Supabase > Storage > New bucket.')
          } else {
            setError(`Erreur: ${uploadError.message}`)
          }
          continue
        }

        // Insérer en DB
        const { error: insertError } = await supabase
          .from('project_documents')
          .insert({
            project_id: projectId,
            user_id: user.id,
            filename: sanitizedName,
            original_name: file.name,
            storage_path: storagePath,
            file_size: file.size,
            mime_type: file.type,
            category
          })

        if (insertError) {
          await supabase.storage.from('project-documents').remove([storagePath])
          if (insertError.code === '42P01') {
            setError('Table "project_documents" non créée. Exécutez la migration SQL.')
          } else {
            setError(`Erreur DB: ${insertError.message}`)
          }
        }
      }

      loadDocuments()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (docId: string, storagePath: string) => {
    if (!confirm('Supprimer ce document?')) return

    try {
      await supabase.storage.from('project-documents').remove([storagePath])
      await supabase.from('project_documents').delete().eq('id', docId)
      loadDocuments()
    } catch (err) {
      console.error('Erreur suppression:', err)
    }
  }

  const getStats = () => ({
    plans: documents.filter(d => d.category === 'plans').length,
    devis: documents.filter(d => d.category === 'devis').length,
    contrats: documents.filter(d => d.category === 'contrats').length,
    photos: documents.filter(d => d.category === 'photos').length,
  })

  const stats = getStats()
  const filteredDocs = selectedCategory 
    ? documents.filter(d => d.category === selectedCategory)
    : documents

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Documents du projet</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate(`/takeoff/${projectId}`)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <Ruler size={16} />
            Importer plans (Takeoff)
          </button>
          <input 
            ref={fileInputRef}
            type="file" 
            multiple 
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
            onChange={(e) => handleUpload(e.target.files, selectedCategory || 'general')}
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Upload document
          </button>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-start gap-3">
          <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Erreur</p>
            <p className="text-sm">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      {/* Structure de dossiers */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { key: 'plans', name: 'Plans', icon: Layers, color: 'bg-purple-100 text-purple-600', count: stats.plans },
          { key: 'devis', name: 'Devis', icon: FileText, color: 'bg-blue-100 text-blue-600', count: stats.devis },
          { key: 'contrats', name: 'Contrats', icon: FileCheck, color: 'bg-green-100 text-green-600', count: stats.contrats },
          { key: 'photos', name: 'Photos', icon: Image, color: 'bg-amber-100 text-amber-600', count: stats.photos },
        ].map(folder => (
          <button 
            key={folder.key}
            onClick={() => setSelectedCategory(selectedCategory === folder.key ? null : folder.key)}
            className={`bg-white rounded-xl p-6 border hover:shadow-md transition text-left ${selectedCategory === folder.key ? 'ring-2 ring-teal-500' : ''}`}
          >
            <div className={`w-12 h-12 rounded-xl ${folder.color} flex items-center justify-center mb-3`}>
              <folder.icon size={24} />
            </div>
            <h4 className="font-medium">{folder.name}</h4>
            <p className="text-sm text-gray-500">{folder.count} fichier(s)</p>
          </button>
        ))}
      </div>

      {/* Zone de drop */}
      <div 
        className={`border-2 border-dashed rounded-xl p-8 text-center transition ${dragOver ? 'border-teal-500 bg-teal-50' : 'border-gray-300'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files, selectedCategory || 'general') }}
      >
        <Upload className="mx-auto mb-3 text-gray-400" size={32} />
        <p className="text-gray-600">Glissez des fichiers ici ou</p>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="mt-2 text-teal-600 hover:text-teal-700 font-medium"
        >
          cliquez pour sélectionner
        </button>
        {selectedCategory && <p className="text-sm text-gray-500 mt-2">Catégorie: {selectedCategory}</p>}
      </div>

      {/* Liste des documents */}
      {filteredDocs.length > 0 ? (
        <div className="bg-white rounded-xl border divide-y">
          {filteredDocs.map(doc => (
            <div key={doc.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                doc.mime_type?.includes('pdf') ? 'bg-red-100 text-red-600' :
                doc.mime_type?.includes('image') ? 'bg-amber-100 text-amber-600' :
                doc.mime_type?.includes('word') || doc.mime_type?.includes('document') ? 'bg-blue-100 text-blue-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                <FileText size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{doc.original_name || doc.filename}</p>
                <p className="text-sm text-gray-500">
                  {doc.category} • {formatFileSize(doc.file_size || 0)} • {new Date(doc.uploaded_at || doc.created_at).toLocaleDateString('fr-CA')}
                </p>
              </div>
              <div className="flex gap-2">
                {doc.file_url && (
                  <a 
                    href={doc.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg"
                  >
                    <Eye size={18} />
                  </a>
                )}
                <button 
                  onClick={() => handleDelete(doc.id, doc.storage_path)}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
          <FolderOpen className="mx-auto mb-3 text-gray-300" size={48} />
          <p>Aucun document{selectedCategory ? ` dans "${selectedCategory}"` : ''}</p>
          <p className="text-sm mt-1">Glissez des fichiers ou cliquez sur "Upload document"</p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// TAB: ESTIMATION
// ============================================================================

function TabEstimation({ projectId, navigate }: { projectId: string; navigate: (path: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Estimation & Takeoff</h3>
        <button 
          onClick={() => navigate(`/takeoff/${projectId}`)}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
        >
          <Ruler size={16} />
          Ouvrir Takeoff complet
        </button>
      </div>

      {/* Résumé estimation */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Ruler className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Mesures</p>
              <p className="text-xl font-bold">0</p>
            </div>
          </div>
          <button 
            onClick={() => navigate(`/takeoff/${projectId}`)}
            className="w-full py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg"
          >
            Faire le takeoff →
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calculator className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Coût matériaux</p>
              <p className="text-xl font-bold">0 $</p>
            </div>
          </div>
          <button className="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg">
            Voir détails →
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Users className="text-red-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Main-d'œuvre CCQ</p>
              <p className="text-xl font-bold">0 $</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/ccq-navigator')}
            className="w-full py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
          >
            Calculer CCQ →
          </button>
        </div>
      </div>

      {/* Workflow Estimation */}
      <div className="bg-white rounded-xl border p-6">
        <h4 className="font-semibold mb-4">Workflow d'estimation</h4>
        <div className="flex items-center justify-between">
          {[
            { step: 1, label: 'Plans', icon: Layers, done: false },
            { step: 2, label: 'Takeoff', icon: Ruler, done: false },
            { step: 3, label: 'Prix', icon: DollarSign, done: false },
            { step: 4, label: 'Main-d\'œuvre', icon: Users, done: false },
            { step: 5, label: 'Soumission', icon: FileText, done: false },
          ].map((item, i) => (
            <div key={item.step} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  item.done ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  <item.icon size={20} />
                </div>
                <span className="text-xs mt-2 text-gray-600">{item.label}</span>
              </div>
              {i < 4 && <div className="w-16 h-0.5 bg-gray-200 mx-2" />}
            </div>
          ))}
        </div>
      </div>

      {/* Lien Estimation ↔ Gestion */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl border border-teal-200 p-6">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <TrendingUp size={18} className="text-teal-600" />
          Flux Estimation → Gestion
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          L'estimation initiale définit le budget et l'échéancier. Les ordres de changement en phase de gestion 
          peuvent nécessiter un nouveau takeoff et ajuster le budget.
        </p>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate(`/project/${projectId}?tab=gestion`)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
          >
            Voir la gestion →
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// TAB: GESTION
// ============================================================================

function TabGestion({ projectId, project, navigate }: { projectId: string; project: Project; navigate: (path: string) => void }) {
  const [ordresChangement] = useState<any[]>([])

  // Modules de gestion Phase 2 (Procore-style)
  const gestionModules = [
    { 
      id: 'journal', 
      label: 'Journal chantier', 
      desc: 'Rapports quotidiens',
      icon: ClipboardList, 
      color: 'bg-blue-100 text-blue-700',
      path: `/project/${projectId}/journal`
    },
    { 
      id: 'rfi', 
      label: 'RFIs', 
      desc: 'Demandes d\'information',
      icon: FileText, 
      color: 'bg-purple-100 text-purple-700',
      path: `/project/${projectId}/rfi-v2`
    },
    { 
      id: 'submittals', 
      label: 'Submittals', 
      desc: 'Documents à approuver',
      icon: FileCheck, 
      color: 'bg-indigo-100 text-indigo-700',
      path: `/project/${projectId}/submittals`
    },
    { 
      id: 'inspections', 
      label: 'Inspections', 
      desc: 'Contrôle qualité',
      icon: Target, 
      color: 'bg-green-100 text-green-700',
      path: `/project/${projectId}/inspections`
    },
    { 
      id: 'punchlist', 
      label: 'Punch List', 
      desc: 'Déficiences à corriger',
      icon: AlertTriangle, 
      color: 'bg-red-100 text-red-700',
      path: `/project/${projectId}/punch-list`
    },
    { 
      id: 'reunions', 
      label: 'Réunions', 
      desc: 'Procès-verbaux',
      icon: Users, 
      color: 'bg-amber-100 text-amber-700',
      path: `/project/${projectId}/reunions-v2`
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Gestion de projet</h3>
        <button className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2">
          <Plus size={16} />
          Ordre de changement
        </button>
      </div>

      {/* Modules de gestion rapides */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {gestionModules.map(module => {
          const Icon = module.icon
          return (
            <button
              key={module.id}
              onClick={() => navigate(module.path)}
              className="bg-white rounded-xl border p-4 hover:shadow-md transition text-left group"
            >
              <div className={`w-10 h-10 rounded-lg ${module.color} flex items-center justify-center mb-3`}>
                <Icon size={20} />
              </div>
              <h4 className="font-semibold text-gray-900 group-hover:text-teal-600">{module.label}</h4>
              <p className="text-sm text-gray-500">{module.desc}</p>
            </button>
          )
        })}
      </div>

      {/* Échéancier */}
      <div className="bg-white rounded-xl border p-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Calendar size={18} />
          Échéancier
        </h4>
        {project.start_date && project.end_date ? (
          <div>
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>{new Date(project.start_date).toLocaleDateString('fr-CA')}</span>
              <span>{new Date(project.end_date).toLocaleDateString('fr-CA')}</span>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full"
                style={{ 
                  width: `${Math.max(0, Math.min(
                    ((Date.now() - new Date(project.start_date).getTime()) / 
                    (new Date(project.end_date).getTime() - new Date(project.start_date).getTime())) * 100, 
                    100
                  ))}%` 
                }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Progression temporelle: {Math.max(0, Math.round(
                ((Date.now() - new Date(project.start_date).getTime()) / 
                (new Date(project.end_date).getTime() - new Date(project.start_date).getTime())) * 100
              ))}%
            </p>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            Définissez les dates du projet pour voir l'échéancier
          </p>
        )}
      </div>

      {/* Ordres de changement */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b flex justify-between items-center">
          <h4 className="font-semibold flex items-center gap-2">
            <Wrench size={18} />
            Ordres de changement
          </h4>
          <span className="text-sm text-gray-500">{ordresChangement.length} ordre(s)</span>
        </div>
        <div className="p-8 text-center text-gray-500">
          <Wrench className="mx-auto mb-3 text-gray-300" size={48} />
          <p>Aucun ordre de changement</p>
          <p className="text-sm mt-1">Les ordres de changement permettent de modifier le scope et budget</p>
        </div>
      </div>

      {/* Lien vers Estimation */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-600" />
          Ordres de changement & Estimation
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          Un ordre de changement peut nécessiter un nouveau relevé de quantités (takeoff) et 
          une mise à jour de l'estimation pour ajuster le budget du projet.
        </p>
        <button 
          onClick={() => navigate(`/takeoff/${projectId}`)}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm"
        >
          Ouvrir Takeoff pour ajustements →
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// TAB: FINANCES
// ============================================================================

function TabFinances({ projectId, stats, project, navigate }: { 
  projectId: string
  stats: ProjectStats
  project: Project
  navigate: (path: string) => void 
}) {
  // Modules financiers Phase 3
  const financeModules = [
    { 
      id: 'budget', 
      label: 'Budget & Coûts', 
      desc: 'Contrôle budgétaire avancé',
      icon: PiggyBank, 
      color: 'bg-blue-100 text-blue-700',
      path: `/project/${projectId}/budget-advanced`
    },
    { 
      id: 'change-orders', 
      label: 'Ordres de changement', 
      desc: 'Gestion des CO',
      icon: FileCheck, 
      color: 'bg-amber-100 text-amber-700',
      path: `/project/${projectId}/change-orders-v2`
    },
    { 
      id: 'payments', 
      label: 'Demandes de paiement', 
      desc: 'Facturation progressive',
      icon: Receipt, 
      color: 'bg-green-100 text-green-700',
      path: `/project/${projectId}/payment-applications`
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Finances</h3>
        <button 
          onClick={() => navigate(`/factures/nouveau?project=${projectId}`)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Receipt size={16} />
          Nouvelle facture
        </button>
      </div>

      {/* Modules financiers Phase 3 */}
      <div className="grid grid-cols-3 gap-4">
        {financeModules.map(module => {
          const Icon = module.icon
          return (
            <button
              key={module.id}
              onClick={() => navigate(module.path)}
              className="bg-white rounded-xl border p-5 hover:shadow-md transition text-left group"
            >
              <div className={`w-12 h-12 rounded-lg ${module.color} flex items-center justify-center mb-3`}>
                <Icon size={24} />
              </div>
              <h4 className="font-semibold text-gray-900 group-hover:text-teal-600">{module.label}</h4>
              <p className="text-sm text-gray-500">{module.desc}</p>
            </button>
          )
        })}
      </div>

      {/* Résumé financier */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border">
          <p className="text-sm text-gray-500">Budget</p>
          <p className="text-2xl font-bold text-gray-900">
            {project.budget?.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }) || '0 $'}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 border">
          <p className="text-sm text-gray-500">Facturé</p>
          <p className="text-2xl font-bold text-blue-600">
            {stats.totalRevenue.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 border">
          <p className="text-sm text-gray-500">Impayé</p>
          <p className="text-2xl font-bold text-amber-600">
            {stats.facturesUnpaid} facture(s)
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 border">
          <p className="text-sm text-gray-500">Marge estimée</p>
          <p className="text-2xl font-bold text-green-600">
            15%
          </p>
        </div>
      </div>

      {/* Liste factures */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b">
          <h4 className="font-semibold">Factures du projet</h4>
        </div>
        <div className="p-8 text-center text-gray-500">
          <Receipt className="mx-auto mb-3 text-gray-300" size={48} />
          <p>Aucune facture</p>
          <p className="text-sm mt-1">Créez votre première facture pour ce projet</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// TAB: ÉDITION
// ============================================================================

function TabEdit({ project, onSave, saving }: { 
  project: Project
  onSave: (data: Partial<Project>) => void
  saving: boolean
}) {
  const [form, setForm] = useState({
    name: project.name || '',
    client_name: project.client_name || '',
    address: project.address || '',
    city: project.city || '',
    province: project.province || 'QC',
    postal_code: project.postal_code || '',
    description: project.description || '',
    status: project.status || 'draft',
    start_date: project.start_date || '',
    end_date: project.end_date || '',
    budget: project.budget?.toString() || '',
    project_type: project.project_type || 'prive',
    project_scope: project.project_scope || 'neuf',
    building_type: project.building_type || 'residence_unifamiliale'
  })

  const handleSubmit = () => {
    onSave({
      ...form,
      budget: form.budget ? parseFloat(form.budget) : undefined
    })
  }

  return (
    <div className="bg-white rounded-xl border p-6 space-y-6">
      {/* Informations de base */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom du projet <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Type et catégorie */}
      <div className="grid grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type de projet</label>
          <select
            value={form.project_type}
            onChange={(e) => setForm({ ...form, project_type: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            {PROJECT_TYPES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Portée</label>
          <select
            value={form.project_scope}
            onChange={(e) => setForm({ ...form, project_scope: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            {PROJECT_SCOPES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type de bâtiment</label>
          <select
            value={form.building_type}
            onChange={(e) => setForm({ ...form, building_type: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            {BUILDING_TYPES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Client */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
        <input
          type="text"
          value={form.client_name}
          onChange={(e) => setForm({ ...form, client_name: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
          placeholder="Nom du client"
        />
      </div>

      {/* Adresse */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
            <select
              value={form.province}
              onChange={(e) => setForm({ ...form, province: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              {PROVINCES.map(prov => (
                <option key={prov.value} value={prov.value}>{prov.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
            <input
              type="text"
              value={form.postal_code}
              onChange={(e) => setForm({ ...form, postal_code: e.target.value.toUpperCase() })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              maxLength={7}
            />
          </div>
        </div>
      </div>

      {/* Dates et budget */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Budget estimé</label>
          <input
            type="number"
            value={form.budget}
            onChange={(e) => setForm({ ...form, budget: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
            placeholder="150000"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={4}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Bouton enregistrer */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={saving || !form.name}
          className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Enregistrer
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function ProjectDetails() {
  const { projectId } = useParams<{ projectId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const isNew = !projectId || projectId === 'new'

  const [project, setProject] = useState<Project | null>(null)
  const [stats, setStats] = useState<ProjectStats>({
    soumissions: 0,
    soumissionsAccepted: 0,
    factures: 0,
    facturesUnpaid: 0,
    measures: 0,
    totalRevenue: 0,
    totalBudget: 0,
    ordresChangement: 0
  })
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const tab = searchParams.get('tab')
    return (tab as TabType) || (isNew ? 'edit' : 'apercu')
  })

  // Charger le projet
  useEffect(() => {
    if (isNew) return

    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: p, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .eq('user_id', user.id)
          .single()

        if (error || !p) {
          navigate('/projects')
          return
        }

        setProject(p)

        // Charger les stats
        const [soumRes, measRes] = await Promise.all([
          supabase.from('soumissions').select('id, status, total').eq('project_id', projectId),
          supabase.from('takeoff_measures').select('id').eq('project_id', projectId)
        ])

        setStats({
          soumissions: soumRes.data?.length || 0,
          soumissionsAccepted: soumRes.data?.filter(s => s.status === 'accepted').length || 0,
          factures: 0,
          facturesUnpaid: 0,
          measures: measRes.data?.length || 0,
          totalRevenue: soumRes.data?.reduce((sum, s) => sum + (s.total || 0), 0) || 0,
          totalBudget: p.budget || 0,
          ordresChangement: 0
        })
      } catch (err) {
        console.error('Erreur:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [projectId, isNew, navigate])

  // Changer d'onglet
  const changeTab = (tab: TabType) => {
    setActiveTab(tab)
    setSearchParams({ tab })
  }

  // Sauvegarder
  const handleSave = async (data: Partial<Project>) => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const projectData = {
        ...data,
        updated_at: new Date().toISOString()
      }

      if (isNew) {
        const { data: newProject, error } = await supabase
          .from('projects')
          .insert({ ...projectData, user_id: user.id })
          .select()
          .single()

        if (error) throw error
        navigate(`/project/${newProject.id}`)
      } else {
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', projectId)

        if (error) throw error
        setProject({ ...project!, ...projectData } as Project)
        changeTab('apercu')
      }
    } catch (err: any) {
      console.error('Erreur:', err)
      alert(`Erreur: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const statusConfig = STATUS_OPTIONS.find(s => s.value === project?.status) || STATUS_OPTIONS[0]

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    )
  }

  // Mode création
  if (isNew) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/projects')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Nouveau projet</h1>
        </div>
        <TabEdit 
          project={{} as Project} 
          onSave={handleSave} 
          saving={saving} 
        />
      </div>
    )
  }

  if (!project) return null

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/projects')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className={`px-2 py-0.5 text-xs rounded-full ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
              {project.client_name && (
                <span className="text-sm text-gray-500">
                  <User size={14} className="inline mr-1" />{project.client_name}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => changeTab('edit')}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <Edit size={16} />
          Modifier
        </button>
      </div>

      {/* Onglets */}
      <div className="border-b">
        <nav className="flex gap-6">
          {[
            { id: 'apercu', label: 'Aperçu', icon: Eye },
            { id: 'documents', label: 'Documents', icon: FolderOpen },
            { id: 'estimation', label: 'Estimation', icon: Calculator },
            { id: 'gestion', label: 'Gestion', icon: ClipboardList },
            { id: 'finances', label: 'Finances', icon: DollarSign },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => changeTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-1 py-3 border-b-2 transition ${
                activeTab === tab.id 
                  ? 'border-teal-600 text-teal-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu de l'onglet */}
      {activeTab === 'apercu' && (
        <TabApercu project={project} stats={stats} navigate={navigate} projectId={projectId!} />
      )}
      {activeTab === 'documents' && (
        <TabDocuments projectId={projectId!} navigate={navigate} />
      )}
      {activeTab === 'estimation' && (
        <TabEstimation projectId={projectId!} navigate={navigate} />
      )}
      {activeTab === 'gestion' && (
        <TabGestion projectId={projectId!} project={project} navigate={navigate} />
      )}
      {activeTab === 'finances' && (
        <TabFinances projectId={projectId!} stats={stats} project={project} navigate={navigate} />
      )}
      {activeTab === 'edit' && (
        <TabEdit project={project} onSave={handleSave} saving={saving} />
      )}
    </div>
  )
}
