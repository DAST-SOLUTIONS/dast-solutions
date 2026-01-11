/**
 * DAST Solutions - Centre d'Import/Export
 * Import Excel multi-feuilles, Export PDF, Templates personnalisables
 */
import React, { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  Upload, Download, FileSpreadsheet, FileText, File, FileImage,
  FolderUp, FolderDown, Settings, Check, X, AlertCircle, Info,
  ChevronRight, ChevronDown, Loader2, Eye, Trash2, Plus, Copy,
  Table, LayoutTemplate, Palette, RefreshCw, ExternalLink,
  FileJson, FileCode, Archive, Calendar, Building2, DollarSign,
  Users, ClipboardList, Package, BarChart3, Shield, Zap
} from 'lucide-react'

// Types
interface ImportFile {
  id: string
  file: File
  name: string
  type: string
  size: number
  status: 'pending' | 'processing' | 'success' | 'error'
  progress: number
  sheets?: string[]
  selectedSheet?: string
  previewData?: any[]
  mapping?: ColumnMapping[]
  errorMessage?: string
  importedCount?: number
}

interface ColumnMapping {
  sourceColumn: string
  targetField: string
  transform?: string
}

interface ExportTemplate {
  id: string
  name: string
  description: string
  type: 'pdf' | 'excel' | 'csv' | 'json'
  category: string
  fields: ExportField[]
  styling: ExportStyling
  isDefault: boolean
  usageCount: number
}

interface ExportField {
  id: string
  source: string
  label: string
  format?: string
  width?: number
  align?: 'left' | 'center' | 'right'
}

interface ExportStyling {
  headerColor: string
  headerTextColor: string
  alternateRows: boolean
  borders: boolean
  fontSize: number
  orientation: 'portrait' | 'landscape'
  paperSize: 'letter' | 'legal' | 'a4'
  margins: { top: number; right: number; bottom: number; left: number }
  logo?: string
  footer?: string
}

// Catégories d'import/export
const CATEGORIES = [
  { id: 'projects', name: 'Projets', icon: Building2 },
  { id: 'clients', name: 'Clients', icon: Users },
  { id: 'soumissions', name: 'Soumissions', icon: ClipboardList },
  { id: 'factures', name: 'Factures', icon: DollarSign },
  { id: 'materials', name: 'Matériaux', icon: Package },
  { id: 'employees', name: 'Employés', icon: Users },
  { id: 'timesheet', name: 'Feuilles de temps', icon: Calendar },
  { id: 'analytics', name: 'Rapports', icon: BarChart3 },
]

// Champs disponibles par catégorie
const FIELD_MAPPINGS: Record<string, { field: string; label: string; type: string }[]> = {
  projects: [
    { field: 'name', label: 'Nom du projet', type: 'text' },
    { field: 'client_name', label: 'Client', type: 'text' },
    { field: 'address', label: 'Adresse', type: 'text' },
    { field: 'budget', label: 'Budget', type: 'currency' },
    { field: 'start_date', label: 'Date début', type: 'date' },
    { field: 'end_date', label: 'Date fin', type: 'date' },
    { field: 'status', label: 'Statut', type: 'status' },
    { field: 'description', label: 'Description', type: 'text' },
  ],
  clients: [
    { field: 'name', label: 'Nom', type: 'text' },
    { field: 'company', label: 'Entreprise', type: 'text' },
    { field: 'email', label: 'Email', type: 'email' },
    { field: 'phone', label: 'Téléphone', type: 'phone' },
    { field: 'address', label: 'Adresse', type: 'text' },
    { field: 'city', label: 'Ville', type: 'text' },
    { field: 'postal_code', label: 'Code postal', type: 'text' },
    { field: 'notes', label: 'Notes', type: 'text' },
  ],
  soumissions: [
    { field: 'number', label: 'Numéro', type: 'text' },
    { field: 'project_name', label: 'Projet', type: 'text' },
    { field: 'client_name', label: 'Client', type: 'text' },
    { field: 'total', label: 'Total', type: 'currency' },
    { field: 'margin', label: 'Marge %', type: 'percent' },
    { field: 'deadline', label: 'Échéance', type: 'date' },
    { field: 'status', label: 'Statut', type: 'status' },
  ],
  materials: [
    { field: 'code', label: 'Code', type: 'text' },
    { field: 'name', label: 'Nom', type: 'text' },
    { field: 'category', label: 'Catégorie', type: 'text' },
    { field: 'unit', label: 'Unité', type: 'text' },
    { field: 'price', label: 'Prix unitaire', type: 'currency' },
    { field: 'supplier', label: 'Fournisseur', type: 'text' },
    { field: 'quantity', label: 'Quantité en stock', type: 'number' },
  ],
}

// Templates par défaut
const DEFAULT_TEMPLATES: Omit<ExportTemplate, 'id'>[] = [
  {
    name: 'Rapport de projet standard',
    description: 'Rapport PDF avec en-tête et pied de page',
    type: 'pdf',
    category: 'projects',
    fields: [
      { id: 'f1', source: 'name', label: 'Projet', width: 30, align: 'left' },
      { id: 'f2', source: 'client_name', label: 'Client', width: 25, align: 'left' },
      { id: 'f3', source: 'budget', label: 'Budget', width: 15, align: 'right', format: 'currency' },
      { id: 'f4', source: 'status', label: 'Statut', width: 15, align: 'center' },
      { id: 'f5', source: 'end_date', label: 'Échéance', width: 15, align: 'center', format: 'date' },
    ],
    styling: {
      headerColor: '#0D9488',
      headerTextColor: '#FFFFFF',
      alternateRows: true,
      borders: true,
      fontSize: 10,
      orientation: 'landscape',
      paperSize: 'letter',
      margins: { top: 20, right: 15, bottom: 20, left: 15 },
      footer: 'DAST Solutions - Généré le {date}'
    },
    isDefault: true,
    usageCount: 0
  },
  {
    name: 'Liste clients Excel',
    description: 'Export Excel avec toutes les colonnes',
    type: 'excel',
    category: 'clients',
    fields: [
      { id: 'f1', source: 'name', label: 'Nom', width: 25 },
      { id: 'f2', source: 'company', label: 'Entreprise', width: 25 },
      { id: 'f3', source: 'email', label: 'Email', width: 30 },
      { id: 'f4', source: 'phone', label: 'Téléphone', width: 15 },
      { id: 'f5', source: 'city', label: 'Ville', width: 15 },
    ],
    styling: {
      headerColor: '#3B82F6',
      headerTextColor: '#FFFFFF',
      alternateRows: true,
      borders: true,
      fontSize: 11,
      orientation: 'portrait',
      paperSize: 'letter',
      margins: { top: 10, right: 10, bottom: 10, left: 10 }
    },
    isDefault: true,
    usageCount: 0
  },
  {
    name: 'Soumissions en cours',
    description: 'Liste des soumissions avec marges',
    type: 'excel',
    category: 'soumissions',
    fields: [
      { id: 'f1', source: 'number', label: 'N°', width: 15 },
      { id: 'f2', source: 'project_name', label: 'Projet', width: 30 },
      { id: 'f3', source: 'client_name', label: 'Client', width: 20 },
      { id: 'f4', source: 'total', label: 'Montant', width: 15, format: 'currency' },
      { id: 'f5', source: 'margin', label: 'Marge', width: 10, format: 'percent' },
      { id: 'f6', source: 'deadline', label: 'Échéance', width: 12, format: 'date' },
    ],
    styling: {
      headerColor: '#F59E0B',
      headerTextColor: '#000000',
      alternateRows: true,
      borders: true,
      fontSize: 10,
      orientation: 'landscape',
      paperSize: 'letter',
      margins: { top: 15, right: 10, bottom: 15, left: 10 }
    },
    isDefault: true,
    usageCount: 0
  }
]

export default function ImportExportCenter() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // États
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'templates'>('import')
  const [importFiles, setImportFiles] = useState<ImportFile[]>([])
  const [templates, setTemplates] = useState<ExportTemplate[]>(
    DEFAULT_TEMPLATES.map((t, i) => ({ ...t, id: `default-${i}` }))
  )
  const [selectedCategory, setSelectedCategory] = useState<string>('projects')
  const [isProcessing, setIsProcessing] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ExportTemplate | null>(null)
  const [exportPreview, setExportPreview] = useState<any[] | null>(null)

  // Gestion des fichiers d'import
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles: ImportFile[] = []
    
    for (const file of Array.from(files)) {
      const importFile: ImportFile = {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        type: getFileType(file.name),
        size: file.size,
        status: 'pending',
        progress: 0
      }

      // Si c'est un Excel, lire les feuilles
      if (importFile.type === 'excel') {
        importFile.sheets = await getExcelSheets(file)
        if (importFile.sheets.length > 0) {
          importFile.selectedSheet = importFile.sheets[0]
        }
      }

      newFiles.push(importFile)
    }

    setImportFiles(prev => [...prev, ...newFiles])
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getFileType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase()
    if (['xlsx', 'xls'].includes(ext || '')) return 'excel'
    if (ext === 'csv') return 'csv'
    if (ext === 'json') return 'json'
    return 'unknown'
  }

  const getExcelSheets = async (file: File): Promise<string[]> => {
    // Simulation - en production, utiliser SheetJS
    return ['Feuille1', 'Feuille2', 'Données']
  }

  const removeImportFile = (fileId: string) => {
    setImportFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const previewFile = async (fileId: string) => {
    const file = importFiles.find(f => f.id === fileId)
    if (!file) return

    // Simulation de preview
    const previewData = [
      { col1: 'Valeur 1', col2: 'Valeur 2', col3: 100 },
      { col1: 'Valeur 3', col2: 'Valeur 4', col3: 200 },
      { col1: 'Valeur 5', col2: 'Valeur 6', col3: 300 },
    ]

    setImportFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, previewData } : f
    ))
  }

  const processImport = async (fileId: string) => {
    setImportFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'processing', progress: 0 } : f
    ))

    // Simulation du traitement
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(r => setTimeout(r, 200))
      setImportFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, progress: i } : f
      ))
    }

    // Succès
    setImportFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'success', importedCount: 42 } : f
    ))
  }

  const processAllImports = async () => {
    setIsProcessing(true)
    const pendingFiles = importFiles.filter(f => f.status === 'pending')
    
    for (const file of pendingFiles) {
      await processImport(file.id)
    }
    
    setIsProcessing(false)
  }

  // Gestion des exports
  const loadExportPreview = async (category: string) => {
    // Simulation - en production, charger depuis Supabase
    const mockData: Record<string, any[]> = {
      projects: [
        { name: 'Centre Sportif Laval', client_name: 'Ville de Laval', budget: 2500000, status: 'En cours', end_date: '2025-06-15' },
        { name: 'Résidence Mont-Royal', client_name: 'Groupe Immobilier XYZ', budget: 1800000, status: 'Planification', end_date: '2025-09-01' },
        { name: 'École Saint-Jean', client_name: 'CSSM', budget: 4200000, status: 'En cours', end_date: '2025-12-20' },
      ],
      clients: [
        { name: 'Jean Tremblay', company: 'Construction JT', email: 'jt@example.com', phone: '514-555-0101', city: 'Montréal' },
        { name: 'Marie Dubois', company: 'Immobilier MD', email: 'md@example.com', phone: '514-555-0102', city: 'Laval' },
      ],
      soumissions: [
        { number: 'S-2025-042', project_name: 'Complexe Montcalm', client_name: 'Client A', total: 450000, margin: 12, deadline: '2025-02-15' },
        { number: 'S-2025-043', project_name: 'Tour Viger', client_name: 'Client B', total: 780000, margin: 10, deadline: '2025-02-20' },
      ]
    }

    setExportPreview(mockData[category] || [])
  }

  const executeExport = async (template: ExportTemplate) => {
    setIsProcessing(true)
    
    // Simulation d'export
    await new Promise(r => setTimeout(r, 1500))
    
    // En production, générer le fichier réel
    alert(`Export "${template.name}" généré avec succès!`)
    
    // Incrémenter le compteur d'utilisation
    setTemplates(prev => prev.map(t => 
      t.id === template.id ? { ...t, usageCount: t.usageCount + 1 } : t
    ))
    
    setIsProcessing(false)
  }

  // Gestion des templates
  const createNewTemplate = () => {
    const newTemplate: ExportTemplate = {
      id: `template-${Date.now()}`,
      name: 'Nouveau template',
      description: '',
      type: 'excel',
      category: selectedCategory,
      fields: [],
      styling: {
        headerColor: '#0D9488',
        headerTextColor: '#FFFFFF',
        alternateRows: true,
        borders: true,
        fontSize: 10,
        orientation: 'portrait',
        paperSize: 'letter',
        margins: { top: 15, right: 10, bottom: 15, left: 10 }
      },
      isDefault: false,
      usageCount: 0
    }
    setEditingTemplate(newTemplate)
  }

  const saveTemplate = (template: ExportTemplate) => {
    const exists = templates.find(t => t.id === template.id)
    if (exists) {
      setTemplates(prev => prev.map(t => t.id === template.id ? template : t))
    } else {
      setTemplates(prev => [...prev, template])
    }
    setEditingTemplate(null)
  }

  const deleteTemplate = (templateId: string) => {
    if (confirm('Supprimer ce template?')) {
      setTemplates(prev => prev.filter(t => t.id !== templateId))
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'excel': return <FileSpreadsheet className="text-green-600" size={24} />
      case 'csv': return <Table className="text-blue-600" size={24} />
      case 'json': return <FileJson className="text-amber-600" size={24} />
      case 'pdf': return <FileText className="text-red-600" size={24} />
      default: return <File className="text-gray-600" size={24} />
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Archive className="text-teal-600" />
            Import / Export
          </h1>
          <p className="text-gray-500">Importez et exportez vos données facilement</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('import')}
          className={`pb-3 px-1 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'import' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500'
          }`}
        >
          <Upload size={18} />
          Importer
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={`pb-3 px-1 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'export' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500'
          }`}
        >
          <Download size={18} />
          Exporter
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`pb-3 px-1 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'templates' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500'
          }`}
        >
          <LayoutTemplate size={18} />
          Templates ({templates.length})
        </button>
      </div>

      {/* Tab: Import */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          {/* Drop Zone */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-teal-400 transition cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const files = e.dataTransfer.files
              if (files.length > 0) {
                const event = { target: { files } } as any
                handleFileSelect(event)
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.json"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <FolderUp size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium text-gray-700 mb-1">
              Glissez vos fichiers ici
            </p>
            <p className="text-sm text-gray-500 mb-4">
              ou cliquez pour sélectionner
            </p>
            <div className="flex justify-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <FileSpreadsheet size={14} /> Excel
              </span>
              <span className="flex items-center gap-1">
                <Table size={14} /> CSV
              </span>
              <span className="flex items-center gap-1">
                <FileJson size={14} /> JSON
              </span>
            </div>
          </div>

          {/* Category Selection */}
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold mb-3">Type de données à importer</h3>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm ${
                    selectedCategory === cat.id
                      ? 'bg-teal-100 text-teal-700 border border-teal-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <cat.icon size={16} />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Files List */}
          {importFiles.length > 0 && (
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">Fichiers à importer ({importFiles.length})</h3>
                <button
                  onClick={processAllImports}
                  disabled={isProcessing || importFiles.every(f => f.status !== 'pending')}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <Zap size={16} />
                      Importer tout
                    </>
                  )}
                </button>
              </div>

              <div className="divide-y">
                {importFiles.map(file => (
                  <div key={file.id} className="p-4">
                    <div className="flex items-center gap-4">
                      {getFileIcon(file.type)}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{file.name}</span>
                          <span className="text-xs text-gray-400">{formatFileSize(file.size)}</span>
                        </div>
                        
                        {/* Sheet selector for Excel */}
                        {file.type === 'excel' && file.sheets && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-gray-500">Feuille:</span>
                            <select
                              value={file.selectedSheet}
                              onChange={(e) => setImportFiles(prev => prev.map(f => 
                                f.id === file.id ? { ...f, selectedSheet: e.target.value } : f
                              ))}
                              className="text-xs border rounded px-2 py-1"
                            >
                              {file.sheets.map(sheet => (
                                <option key={sheet} value={sheet}>{sheet}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Progress bar */}
                        {file.status === 'processing' && (
                          <div className="mt-2">
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-teal-500 transition-all duration-300"
                                style={{ width: `${file.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{file.progress}%</span>
                          </div>
                        )}

                        {/* Success message */}
                        {file.status === 'success' && (
                          <div className="mt-2 flex items-center gap-1 text-green-600 text-sm">
                            <Check size={14} />
                            {file.importedCount} enregistrements importés
                          </div>
                        )}

                        {/* Error message */}
                        {file.status === 'error' && (
                          <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                            <AlertCircle size={14} />
                            {file.errorMessage || 'Erreur lors de l\'import'}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {file.status === 'pending' && (
                          <>
                            <button
                              onClick={() => previewFile(file.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                              title="Aperçu"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => processImport(file.id)}
                              className="p-2 hover:bg-teal-100 rounded-lg text-teal-600"
                              title="Importer"
                            >
                              <Upload size={18} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => removeImportFile(file.id)}
                          className="p-2 hover:bg-red-100 rounded-lg text-red-500"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Preview data */}
                    {file.previewData && (
                      <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm border rounded">
                          <thead className="bg-gray-100">
                            <tr>
                              {Object.keys(file.previewData[0] || {}).map(col => (
                                <th key={col} className="px-3 py-2 text-left font-medium">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {file.previewData.slice(0, 3).map((row, i) => (
                              <tr key={i} className="border-t">
                                {Object.values(row).map((val: any, j) => (
                                  <td key={j} className="px-3 py-2">{String(val)}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p className="text-xs text-gray-500 mt-1">
                          Aperçu des 3 premières lignes
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Import Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
              <Info size={16} />
              Conseils d'import
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• La première ligne de votre fichier doit contenir les en-têtes de colonnes</li>
              <li>• Les dates doivent être au format AAAA-MM-JJ ou JJ/MM/AAAA</li>
              <li>• Les montants ne doivent pas contenir de symbole de devise</li>
              <li>• Les fichiers Excel peuvent contenir plusieurs feuilles</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab: Export */}
      {activeTab === 'export' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Category & Data Selection */}
          <div className="lg:col-span-2 space-y-4">
            {/* Category */}
            <div className="bg-white rounded-xl border p-4">
              <h3 className="font-semibold mb-3">Données à exporter</h3>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id)
                      loadExportPreview(cat.id)
                    }}
                    className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm ${
                      selectedCategory === cat.id
                        ? 'bg-teal-100 text-teal-700 border border-teal-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <cat.icon size={16} />
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {exportPreview && (
              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Aperçu des données ({exportPreview.length} enregistrements)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {exportPreview[0] && Object.keys(exportPreview[0]).map(key => (
                          <th key={key} className="px-4 py-2 text-left font-medium text-gray-600">
                            {FIELD_MAPPINGS[selectedCategory]?.find(f => f.field === key)?.label || key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {exportPreview.map((row, i) => (
                        <tr key={i} className="border-t hover:bg-gray-50">
                          {Object.entries(row).map(([key, val]: [string, any], j) => (
                            <td key={j} className="px-4 py-2">
                              {typeof val === 'number' && key.includes('budget') || key.includes('total')
                                ? val.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })
                                : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Templates for export */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border p-4">
              <h3 className="font-semibold mb-3">Templates disponibles</h3>
              <div className="space-y-2">
                {templates
                  .filter(t => t.category === selectedCategory)
                  .map(template => (
                    <div
                      key={template.id}
                      className="p-3 border rounded-lg hover:border-teal-400 cursor-pointer"
                      onClick={() => executeExport(template)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {template.type === 'pdf' && <FileText size={16} className="text-red-500" />}
                        {template.type === 'excel' && <FileSpreadsheet size={16} className="text-green-500" />}
                        {template.type === 'csv' && <Table size={16} className="text-blue-500" />}
                        <span className="font-medium text-sm">{template.name}</span>
                      </div>
                      <p className="text-xs text-gray-500">{template.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                        <span>{template.fields.length} colonnes</span>
                        <span>•</span>
                        <span>Utilisé {template.usageCount}x</span>
                      </div>
                    </div>
                  ))}

                {templates.filter(t => t.category === selectedCategory).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Aucun template pour cette catégorie
                  </p>
                )}
              </div>

              <button
                onClick={createNewTemplate}
                className="w-full mt-4 py-2 border-2 border-dashed rounded-lg text-sm text-gray-500 hover:border-teal-400 hover:text-teal-600 flex items-center justify-center gap-1"
              >
                <Plus size={14} />
                Créer un template
              </button>
            </div>

            {/* Quick Export */}
            <div className="bg-white rounded-xl border p-4">
              <h3 className="font-semibold mb-3">Export rapide</h3>
              <div className="space-y-2">
                <button
                  onClick={() => alert('Export Excel généré!')}
                  className="w-full py-2 px-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center justify-center gap-2 text-sm"
                >
                  <FileSpreadsheet size={16} />
                  Exporter en Excel
                </button>
                <button
                  onClick={() => alert('Export CSV généré!')}
                  className="w-full py-2 px-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center justify-center gap-2 text-sm"
                >
                  <Table size={16} />
                  Exporter en CSV
                </button>
                <button
                  onClick={() => alert('Export PDF généré!')}
                  className="w-full py-2 px-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center justify-center gap-2 text-sm"
                >
                  <FileText size={16} />
                  Exporter en PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Templates */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {templates.length} template(s) configuré(s)
            </p>
            <button
              onClick={createNewTemplate}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
            >
              <Plus size={16} />
              Nouveau template
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => (
              <div key={template.id} className="bg-white rounded-xl border p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {template.type === 'pdf' && <FileText size={20} className="text-red-500" />}
                    {template.type === 'excel' && <FileSpreadsheet size={20} className="text-green-500" />}
                    {template.type === 'csv' && <Table size={20} className="text-blue-500" />}
                    {template.type === 'json' && <FileJson size={20} className="text-amber-500" />}
                    <div>
                      <h3 className="font-medium">{template.name}</h3>
                      <span className="text-xs text-gray-500">
                        {CATEGORIES.find(c => c.id === template.category)?.name}
                      </span>
                    </div>
                  </div>
                  {template.isDefault && (
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded">
                      Par défaut
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-500 mb-3">{template.description || 'Aucune description'}</p>

                <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                  <span>{template.fields.length} colonnes</span>
                  <span>{template.styling.orientation}</span>
                  <span>Utilisé {template.usageCount}x</span>
                </div>

                {/* Preview styling */}
                <div className="flex items-center gap-2 mb-4">
                  <div 
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: template.styling.headerColor }}
                    title="Couleur en-tête"
                  />
                  <span className="text-xs text-gray-500">
                    {template.styling.fontSize}pt • {template.styling.paperSize.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingTemplate(template)}
                    className="flex-1 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => executeExport(template)}
                    className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
                  >
                    Utiliser
                  </button>
                  {!template.isDefault && (
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      className="p-2 hover:bg-red-100 rounded-lg text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Template Editor Modal */}
      {editingTemplate && (
        <TemplateEditor
          template={editingTemplate}
          fields={FIELD_MAPPINGS[editingTemplate.category] || []}
          onSave={saveTemplate}
          onClose={() => setEditingTemplate(null)}
        />
      )}
    </div>
  )
}

// Template Editor Component
function TemplateEditor({ 
  template, 
  fields, 
  onSave, 
  onClose 
}: { 
  template: ExportTemplate
  fields: { field: string; label: string; type: string }[]
  onSave: (template: ExportTemplate) => void
  onClose: () => void
}) {
  const [editedTemplate, setEditedTemplate] = useState<ExportTemplate>(template)

  const addField = () => {
    const newField: ExportField = {
      id: `field-${Date.now()}`,
      source: '',
      label: '',
      width: 20
    }
    setEditedTemplate(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }))
  }

  const updateField = (fieldId: string, updates: Partial<ExportField>) => {
    setEditedTemplate(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f)
    }))
  }

  const removeField = (fieldId: string) => {
    setEditedTemplate(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== fieldId)
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {template.id.startsWith('template-') ? 'Nouveau template' : 'Modifier le template'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold">Informations générales</h3>
              
              <div>
                <label className="block text-sm font-medium mb-1">Nom du template</label>
                <input
                  type="text"
                  value={editedTemplate.name}
                  onChange={(e) => setEditedTemplate({ ...editedTemplate, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={editedTemplate.description}
                  onChange={(e) => setEditedTemplate({ ...editedTemplate, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Format</label>
                  <select
                    value={editedTemplate.type}
                    onChange={(e) => setEditedTemplate({ ...editedTemplate, type: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="excel">Excel (.xlsx)</option>
                    <option value="pdf">PDF</option>
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Catégorie</label>
                  <select
                    value={editedTemplate.category}
                    onChange={(e) => setEditedTemplate({ ...editedTemplate, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Styling */}
            <div className="space-y-4">
              <h3 className="font-semibold">Style</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Couleur en-tête</label>
                  <input
                    type="color"
                    value={editedTemplate.styling.headerColor}
                    onChange={(e) => setEditedTemplate({
                      ...editedTemplate,
                      styling: { ...editedTemplate.styling, headerColor: e.target.value }
                    })}
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Taille police</label>
                  <select
                    value={editedTemplate.styling.fontSize}
                    onChange={(e) => setEditedTemplate({
                      ...editedTemplate,
                      styling: { ...editedTemplate.styling, fontSize: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {[8, 9, 10, 11, 12, 14].map(size => (
                      <option key={size} value={size}>{size}pt</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Orientation</label>
                  <select
                    value={editedTemplate.styling.orientation}
                    onChange={(e) => setEditedTemplate({
                      ...editedTemplate,
                      styling: { ...editedTemplate.styling, orientation: e.target.value as any }
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Paysage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Format papier</label>
                  <select
                    value={editedTemplate.styling.paperSize}
                    onChange={(e) => setEditedTemplate({
                      ...editedTemplate,
                      styling: { ...editedTemplate.styling, paperSize: e.target.value as any }
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="letter">Lettre</option>
                    <option value="legal">Légal</option>
                    <option value="a4">A4</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editedTemplate.styling.alternateRows}
                    onChange={(e) => setEditedTemplate({
                      ...editedTemplate,
                      styling: { ...editedTemplate.styling, alternateRows: e.target.checked }
                    })}
                    className="rounded"
                  />
                  <span className="text-sm">Lignes alternées</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editedTemplate.styling.borders}
                    onChange={(e) => setEditedTemplate({
                      ...editedTemplate,
                      styling: { ...editedTemplate.styling, borders: e.target.checked }
                    })}
                    className="rounded"
                  />
                  <span className="text-sm">Bordures</span>
                </label>
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Colonnes ({editedTemplate.fields.length})</h3>
              <button
                onClick={addField}
                className="px-3 py-1.5 text-sm text-teal-600 hover:bg-teal-50 rounded-lg flex items-center gap-1"
              >
                <Plus size={14} />
                Ajouter colonne
              </button>
            </div>

            <div className="space-y-2">
              {editedTemplate.fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2 p-2 border rounded-lg">
                  <span className="text-xs text-gray-400 w-6">{index + 1}</span>
                  <select
                    value={field.source}
                    onChange={(e) => {
                      const selectedField = fields.find(f => f.field === e.target.value)
                      updateField(field.id, { 
                        source: e.target.value,
                        label: selectedField?.label || e.target.value
                      })
                    }}
                    className="flex-1 px-2 py-1.5 border rounded text-sm"
                  >
                    <option value="">Sélectionner...</option>
                    {fields.map(f => (
                      <option key={f.field} value={f.field}>{f.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    placeholder="Libellé"
                    className="w-32 px-2 py-1.5 border rounded text-sm"
                  />
                  <input
                    type="number"
                    value={field.width || 20}
                    onChange={(e) => updateField(field.id, { width: Number(e.target.value) })}
                    className="w-16 px-2 py-1.5 border rounded text-sm text-center"
                    min="5"
                    max="50"
                  />
                  <button
                    onClick={() => removeField(field.id)}
                    className="p-1.5 hover:bg-red-100 rounded text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {editedTemplate.fields.length === 0 && (
                <p className="text-center py-4 text-gray-500 text-sm">
                  Aucune colonne définie. Cliquez sur "Ajouter colonne" pour commencer.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={() => onSave(editedTemplate)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
