/**
 * DAST Solutions - Import de Données
 * Import CSV/Excel pour projets, entrepreneurs, personnel
 */
import { useState, useCallback, useRef } from 'react'
import { PageTitle } from '@/components/PageTitle'
import { supabase } from '@/lib/supabase'
import {
  Upload, FileSpreadsheet, Check, X, AlertTriangle, Download,
  FolderOpen, Users, HardHat, Loader2, ChevronRight, ChevronDown,
  FileText, CheckCircle, XCircle, Info
} from 'lucide-react'
import * as XLSX from 'xlsx'

// Types
type ImportType = 'projects' | 'entrepreneurs' | 'personnel'

interface ImportColumn {
  key: string
  label: string
  required: boolean
  example: string
  dbField: string
}

interface ParsedRow {
  rowNumber: number
  data: Record<string, any>
  errors: string[]
  warnings: string[]
  valid: boolean
}

interface ImportResult {
  total: number
  success: number
  failed: number
  errors: Array<{ row: number; error: string }>
}

// Configuration des colonnes par type d'import
const IMPORT_CONFIGS: Record<ImportType, { title: string; columns: ImportColumn[] }> = {
  projects: {
    title: 'Projets',
    columns: [
      { key: 'name', label: 'Nom du projet', required: true, example: 'Rénovation École St-Jean', dbField: 'name' },
      { key: 'project_number', label: 'Numéro de projet', required: false, example: 'PRJ-2024-001', dbField: 'project_number' },
      { key: 'client_name', label: 'Client', required: false, example: 'CSSDM', dbField: 'client_name' },
      { key: 'project_type', label: 'Type', required: false, example: 'Commercial', dbField: 'project_type' },
      { key: 'address', label: 'Adresse', required: false, example: '123 Rue Principale, Montréal', dbField: 'address' },
      { key: 'project_value', label: 'Valeur ($)', required: false, example: '150000', dbField: 'project_value' },
      { key: 'start_date', label: 'Date début', required: false, example: '2024-01-15', dbField: 'start_date' },
      { key: 'end_date', label: 'Date fin', required: false, example: '2024-06-30', dbField: 'end_date' },
      { key: 'status', label: 'Statut', required: false, example: 'en_cours', dbField: 'status' },
      { key: 'description', label: 'Description', required: false, example: 'Rénovation complète...', dbField: 'description' },
    ]
  },
  entrepreneurs: {
    title: 'Entrepreneurs',
    columns: [
      { key: 'nom', label: 'Nom entreprise', required: true, example: 'Construction ABC', dbField: 'nom' },
      { key: 'neq', label: 'NEQ', required: false, example: '1234567890', dbField: 'neq' },
      { key: 'rbq_licence', label: 'Licence RBQ', required: false, example: '1234-5678-90', dbField: 'rbq_licence' },
      { key: 'specialites', label: 'Spécialités', required: false, example: 'Électricité, Plomberie', dbField: 'specialites' },
      { key: 'adresse_ville', label: 'Ville', required: false, example: 'Montréal', dbField: 'adresse_ville' },
      { key: 'telephone', label: 'Téléphone', required: false, example: '514-555-1234', dbField: 'telephone' },
      { key: 'email', label: 'Courriel', required: false, example: 'info@abc.ca', dbField: 'email' },
      { key: 'contact_nom', label: 'Contact principal', required: false, example: 'Jean Tremblay', dbField: 'contact_nom' },
      { key: 'notes', label: 'Notes', required: false, example: 'Bon travail sur projet X', dbField: 'notes' },
    ]
  },
  personnel: {
    title: 'Personnel CCQ',
    columns: [
      { key: 'nom', label: 'Nom', required: true, example: 'Tremblay', dbField: 'nom' },
      { key: 'prenom', label: 'Prénom', required: true, example: 'Jean', dbField: 'prenom' },
      { key: 'numero_ccq', label: 'Numéro CCQ', required: false, example: 'CCQ-123456', dbField: 'numero_ccq' },
      { key: 'metier_code', label: 'Code métier', required: false, example: '08', dbField: 'metier_code' },
      { key: 'metier_nom', label: 'Métier', required: false, example: 'Électricien', dbField: 'metier_nom' },
      { key: 'telephone', label: 'Téléphone', required: false, example: '514-555-1234', dbField: 'telephone' },
      { key: 'email', label: 'Courriel', required: false, example: 'jean@example.com', dbField: 'email' },
      { key: 'date_embauche', label: 'Date embauche', required: false, example: '2023-03-15', dbField: 'date_embauche' },
      { key: 'taux_horaire', label: 'Taux horaire', required: false, example: '45.00', dbField: 'taux_horaire_actuel' },
      { key: 'competences', label: 'Compétences', required: false, example: 'ASP, SIMDUT', dbField: 'competences' },
    ]
  }
}

export default function ImportData() {
  const [importType, setImportType] = useState<ImportType>('projects')
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload')
  const [showGuide, setShowGuide] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const config = IMPORT_CONFIGS[importType]

  // Reset
  const reset = () => {
    setFile(null)
    setParsedData([])
    setResult(null)
    setStep('upload')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Parse fichier
  const parseFile = useCallback(async (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase()
    
    try {
      let data: any[][]
      
      if (extension === 'csv') {
        const text = await file.text()
        data = parseCSV(text)
      } else if (['xlsx', 'xls'].includes(extension || '')) {
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][]
      } else {
        throw new Error('Format non supporté. Utilisez CSV ou Excel.')
      }

      if (data.length < 2) {
        throw new Error('Le fichier doit contenir au moins un en-tête et une ligne de données.')
      }

      // Première ligne = en-têtes
      const headers = data[0].map((h: any) => String(h).toLowerCase().trim())
      
      // Mapper les colonnes
      const columnMapping = new Map<number, ImportColumn>()
      config.columns.forEach(col => {
        const index = headers.findIndex(h => 
          h === col.key.toLowerCase() || 
          h === col.label.toLowerCase() ||
          h.includes(col.key.toLowerCase())
        )
        if (index !== -1) {
          columnMapping.set(index, col)
        }
      })

      // Parser les données
      const parsed: ParsedRow[] = []
      for (let i = 1; i < data.length; i++) {
        const row = data[i]
        if (!row || row.every(cell => !cell)) continue // Skip empty rows

        const rowData: Record<string, any> = {}
        const errors: string[] = []
        const warnings: string[] = []

        // Extraire les valeurs
        columnMapping.forEach((col, index) => {
          const value = row[index]
          if (value !== undefined && value !== null && value !== '') {
            // Conversion selon le type
            if (col.key.includes('date')) {
              rowData[col.dbField] = parseDate(value)
            } else if (col.key.includes('value') || col.key.includes('taux')) {
              rowData[col.dbField] = parseNumber(value)
            } else if (col.key === 'specialites' || col.key === 'competences') {
              rowData[col.dbField] = parseArray(value)
            } else {
              rowData[col.dbField] = String(value).trim()
            }
          }
        })

        // Vérifier les champs requis
        config.columns.filter(c => c.required).forEach(col => {
          if (!rowData[col.dbField]) {
            errors.push(`${col.label} est requis`)
          }
        })

        // Ajouter des warnings
        if (importType === 'entrepreneurs' && !rowData.rbq_licence) {
          warnings.push('Pas de licence RBQ')
        }

        parsed.push({
          rowNumber: i + 1,
          data: rowData,
          errors,
          warnings,
          valid: errors.length === 0
        })
      }

      // Vérifier qu'on a trouvé des colonnes
      if (columnMapping.size === 0) {
        throw new Error('Aucune colonne reconnue. Vérifiez les en-têtes du fichier.')
      }

      setParsedData(parsed)
      setStep('preview')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur lors de la lecture du fichier')
    }
  }, [config, importType])

  // Helpers de parsing
  const parseCSV = (text: string): string[][] => {
    const lines = text.split(/\r?\n/)
    return lines.map(line => {
      const result: string[] = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if ((char === ',' || char === ';') && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      result.push(current.trim())
      return result
    })
  }

  const parseDate = (value: any): string | null => {
    if (!value) return null
    try {
      // Excel date (number)
      if (typeof value === 'number') {
        const date = new Date((value - 25569) * 86400 * 1000)
        return date.toISOString().split('T')[0]
      }
      // String date
      const parsed = new Date(value)
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0]
      }
    } catch {}
    return null
  }

  const parseNumber = (value: any): number | null => {
    if (typeof value === 'number') return value
    const cleaned = String(value).replace(/[^0-9.-]/g, '')
    const num = parseFloat(cleaned)
    return isNaN(num) ? null : num
  }

  const parseArray = (value: any): string[] => {
    if (Array.isArray(value)) return value
    return String(value).split(/[,;]/).map(s => s.trim()).filter(Boolean)
  }

  // Import dans Supabase
  const handleImport = async () => {
    const validRows = parsedData.filter(r => r.valid)
    if (validRows.length === 0) {
      alert('Aucune ligne valide à importer')
      return
    }

    setImporting(true)
    const errors: Array<{ row: number; error: string }> = []
    let successCount = 0

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const tableName = importType === 'projects' ? 'projects' : 
                        importType === 'entrepreneurs' ? 'entrepreneurs' : 
                        'personnel_ccq'

      for (const row of validRows) {
        try {
          const insertData: Record<string, any> = {
            ...row.data,
            user_id: user.id,
            created_at: new Date().toISOString()
          }

          // Pour les entrepreneurs, ajouter le contact si présent
          if (importType === 'entrepreneurs' && insertData.contact_nom) {
            const contactNom = insertData.contact_nom
            delete insertData.contact_nom
            
            const { data: entrepreneur, error: entError } = await supabase
              .from('entrepreneurs')
              .insert(insertData)
              .select('id')
              .single()

            if (entError) throw entError

            if (entrepreneur) {
              await supabase.from('entrepreneur_contacts').insert({
                entrepreneur_id: entrepreneur.id,
                nom: contactNom,
                is_principal: true
              })
            }
          } else {
            const { error } = await supabase.from(tableName).insert(insertData)
            if (error) throw error
          }

          successCount++
        } catch (err) {
          errors.push({
            row: row.rowNumber,
            error: err instanceof Error ? err.message : 'Erreur inconnue'
          })
        }
      }

      setResult({
        total: validRows.length,
        success: successCount,
        failed: errors.length,
        errors
      })
      setStep('result')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'import')
    } finally {
      setImporting(false)
    }
  }

  // Télécharger template
  const downloadTemplate = () => {
    const headers = config.columns.map(c => c.label)
    const examples = config.columns.map(c => c.example)
    
    const csv = [headers.join(','), examples.join(',')].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `template_${importType}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageTitle title="Import de données" />
      <p className="text-gray-500 mt-1 mb-8">Importez vos projets, entrepreneurs et personnel depuis Excel ou CSV</p>

      {/* Type selector */}
      <div className="flex gap-4 mb-8">
        {(['projects', 'entrepreneurs', 'personnel'] as ImportType[]).map(type => (
          <button
            key={type}
            onClick={() => { setImportType(type); reset() }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl border-2 transition-all ${
              importType === type 
                ? 'border-teal-500 bg-teal-50 text-teal-700' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {type === 'projects' && <FolderOpen size={20} />}
            {type === 'entrepreneurs' && <Users size={20} />}
            {type === 'personnel' && <HardHat size={20} />}
            <span className="font-medium">{IMPORT_CONFIGS[type].title}</span>
          </button>
        ))}
      </div>

      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="space-y-6">
          {/* Guide */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-3">
                <Info size={24} className="text-blue-600" />
                <span className="font-semibold text-blue-900">Guide d'import - {config.title}</span>
              </div>
              {showGuide ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </button>
            
            {showGuide && (
              <div className="mt-4 space-y-4">
                <p className="text-blue-800">Colonnes attendues dans votre fichier:</p>
                <div className="grid grid-cols-2 gap-2">
                  {config.columns.map(col => (
                    <div key={col.key} className="flex items-center gap-2 text-sm">
                      <span className={`w-2 h-2 rounded-full ${col.required ? 'bg-red-500' : 'bg-gray-300'}`} />
                      <span className="font-medium text-blue-900">{col.label}</span>
                      <span className="text-blue-600">ex: {col.example}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Download size={18} />
                  Télécharger le template
                </button>
              </div>
            )}
          </div>

          {/* Upload zone */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-teal-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-teal-400', 'bg-teal-50') }}
            onDragLeave={(e) => { e.currentTarget.classList.remove('border-teal-400', 'bg-teal-50') }}
            onDrop={(e) => {
              e.preventDefault()
              e.currentTarget.classList.remove('border-teal-400', 'bg-teal-50')
              const droppedFile = e.dataTransfer.files[0]
              if (droppedFile) {
                setFile(droppedFile)
                parseFile(droppedFile)
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0]
                if (selectedFile) {
                  setFile(selectedFile)
                  parseFile(selectedFile)
                }
              }}
            />
            <FileSpreadsheet size={64} className="mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Glissez votre fichier ici ou cliquez pour sélectionner
            </p>
            <p className="text-gray-500">Formats acceptés: CSV, Excel (.xlsx, .xls)</p>
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-4">
              <FileText size={24} className="text-gray-600" />
              <div>
                <p className="font-medium">{file?.name}</p>
                <p className="text-sm text-gray-500">
                  {parsedData.length} lignes • {parsedData.filter(r => r.valid).length} valides • {parsedData.filter(r => !r.valid).length} erreurs
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={reset} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">
                Annuler
              </button>
              <button
                onClick={handleImport}
                disabled={importing || parsedData.filter(r => r.valid).length === 0}
                className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                {importing ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                Importer {parsedData.filter(r => r.valid).length} lignes
              </button>
            </div>
          </div>

          {/* Preview table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="max-h-[500px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 w-16">#</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 w-20">Statut</th>
                    {config.columns.slice(0, 5).map(col => (
                      <th key={col.key} className="px-4 py-3 text-left font-medium text-gray-600">
                        {col.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Messages</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {parsedData.slice(0, 100).map((row) => (
                    <tr key={row.rowNumber} className={row.valid ? '' : 'bg-red-50'}>
                      <td className="px-4 py-3 text-gray-500">{row.rowNumber}</td>
                      <td className="px-4 py-3">
                        {row.valid ? (
                          <CheckCircle size={18} className="text-green-500" />
                        ) : (
                          <XCircle size={18} className="text-red-500" />
                        )}
                      </td>
                      {config.columns.slice(0, 5).map(col => (
                        <td key={col.key} className="px-4 py-3 max-w-[200px] truncate">
                          {Array.isArray(row.data[col.dbField]) 
                            ? row.data[col.dbField].join(', ')
                            : row.data[col.dbField] || '-'}
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        {row.errors.length > 0 && (
                          <span className="text-red-600 text-xs">{row.errors.join(', ')}</span>
                        )}
                        {row.warnings.length > 0 && (
                          <span className="text-amber-600 text-xs ml-2">{row.warnings.join(', ')}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedData.length > 100 && (
              <div className="px-4 py-3 bg-gray-50 text-sm text-gray-500 text-center">
                Affichage des 100 premières lignes sur {parsedData.length}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step: Result */}
      {step === 'result' && result && (
        <div className="space-y-6">
          {/* Success/Failure summary */}
          <div className={`p-6 rounded-xl ${result.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
            <div className="flex items-center gap-4">
              {result.failed === 0 ? (
                <CheckCircle size={48} className="text-green-500" />
              ) : (
                <AlertTriangle size={48} className="text-amber-500" />
              )}
              <div>
                <h3 className="text-xl font-bold">
                  {result.failed === 0 ? 'Import réussi!' : 'Import terminé avec des erreurs'}
                </h3>
                <p className="text-gray-600 mt-1">
                  {result.success} sur {result.total} lignes importées avec succès
                  {result.failed > 0 && ` • ${result.failed} erreurs`}
                </p>
              </div>
            </div>
          </div>

          {/* Errors list */}
          {result.errors.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Erreurs détaillées</h4>
              <div className="space-y-2 max-h-[300px] overflow-auto">
                {result.errors.map((err, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm p-2 bg-red-50 rounded">
                    <span className="font-medium text-red-700">Ligne {err.row}:</span>
                    <span className="text-red-600">{err.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={reset}
              className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              <Upload size={18} />
              Nouvel import
            </button>
            <button
              onClick={() => window.location.href = `/${importType === 'projects' ? 'projets' : importType === 'entrepreneurs' ? 'entrepreneurs/rbq' : 'entrepreneurs/personnel'}`}
              className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Voir les données importées
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
