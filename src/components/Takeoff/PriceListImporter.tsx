/**
 * DAST Solutions - PriceListImporter
 * Import de listes de prix depuis Excel/CSV
 */
import { useState, useCallback, useRef } from 'react'
import {
  Upload, FileSpreadsheet, Check, AlertCircle, Loader2,
  X, Download, Eye, Trash2, Plus
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'

interface Material {
  code: string
  name: string
  category: string
  unit: string
  unit_price: number
  supplier?: string
}

interface PriceList {
  id: string
  name: string
  description: string
  source: string
  material_count: number
  created_at: string
}

interface PriceListImporterProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete?: (priceListId: string) => void
}

export function PriceListImporter({
  isOpen,
  onClose,
  onImportComplete
}: PriceListImporterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // État
  const [step, setStep] = useState<'upload' | 'preview' | 'mapping' | 'saving'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [rawData, setRawData] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  
  // Mapping des colonnes
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    code: '',
    name: '',
    category: '',
    unit: '',
    unit_price: '',
    supplier: ''
  })
  
  // Métadonnées de la liste
  const [listName, setListName] = useState('')
  const [listDescription, setListDescription] = useState('')
  const [listSource, setListSource] = useState('')
  
  // UI
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Lire le fichier Excel/CSV
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    setError(null)
    setIsLoading(true)

    try {
      const data = await uploadedFile.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      if (jsonData.length < 2) {
        throw new Error('Le fichier doit contenir au moins une ligne d\'en-tête et une ligne de données')
      }

      // Première ligne = en-têtes
      const headerRow = jsonData[0] as string[]
      setHeaders(headerRow.map(h => String(h || '').trim()))
      
      // Reste = données
      const dataRows = jsonData.slice(1) as any[][]
      setRawData(dataRows.filter(row => row.some(cell => cell !== undefined && cell !== '')))

      // Auto-mapper les colonnes connues
      const autoMapping: Record<string, string> = {
        code: '',
        name: '',
        category: '',
        unit: '',
        unit_price: '',
        supplier: ''
      }

      headerRow.forEach((header, index) => {
        const h = String(header).toLowerCase()
        if (h.includes('code') || h.includes('ref') || h.includes('sku')) {
          autoMapping.code = String(index)
        } else if (h.includes('nom') || h.includes('name') || h.includes('description') || h.includes('produit')) {
          autoMapping.name = String(index)
        } else if (h.includes('categ') || h.includes('type') || h.includes('famille')) {
          autoMapping.category = String(index)
        } else if (h.includes('unit') || h.includes('unité') || h.includes('um')) {
          autoMapping.unit = String(index)
        } else if (h.includes('prix') || h.includes('price') || h.includes('cout') || h.includes('cost') || h.includes('$')) {
          autoMapping.unit_price = String(index)
        } else if (h.includes('fourn') || h.includes('supplier') || h.includes('vendor')) {
          autoMapping.supplier = String(index)
        }
      })

      setColumnMapping(autoMapping)
      setListName(uploadedFile.name.replace(/\.[^/.]+$/, ''))
      setStep('preview')
    } catch (err) {
      console.error('Erreur lecture fichier:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la lecture du fichier')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Appliquer le mapping et générer les matériaux
  const applyMapping = useCallback(() => {
    const mappedMaterials: Material[] = rawData
      .map((row, index) => {
        const getValue = (key: string) => {
          const colIndex = parseInt(columnMapping[key])
          if (isNaN(colIndex)) return ''
          return row[colIndex] ?? ''
        }

        const priceStr = String(getValue('unit_price')).replace(/[^0-9.,]/g, '').replace(',', '.')
        const price = parseFloat(priceStr) || 0

        return {
          code: String(getValue('code') || `MAT-${index + 1}`),
          name: String(getValue('name') || ''),
          category: String(getValue('category') || 'Autre'),
          unit: String(getValue('unit') || 'unité'),
          unit_price: price,
          supplier: String(getValue('supplier') || '')
        }
      })
      .filter(m => m.name && m.unit_price > 0)

    setMaterials(mappedMaterials)
    setStep('mapping')
  }, [rawData, columnMapping])

  // Sauvegarder dans Supabase
  const saveToDatabase = useCallback(async () => {
    if (materials.length === 0) {
      setError('Aucun matériau valide à importer')
      return
    }

    setIsLoading(true)
    setStep('saving')
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Créer la liste de prix
      const { data: priceList, error: listError } = await supabase
        .from('material_price_lists')
        .insert({
          user_id: user.id,
          name: listName || 'Liste importée',
          description: listDescription,
          source: listSource || file?.name,
          imported_from: file?.name.endsWith('.csv') ? 'csv' : 'excel',
          original_filename: file?.name
        })
        .select()
        .single()

      if (listError) throw listError

      // Insérer les matériaux
      const materialsToInsert = materials.map(m => ({
        price_list_id: priceList.id,
        code: m.code,
        name: m.name,
        category: m.category,
        unit: m.unit,
        unit_price: m.unit_price,
        supplier: m.supplier
      }))

      const { error: materialsError } = await supabase
        .from('materials')
        .insert(materialsToInsert)

      if (materialsError) throw materialsError

      setSuccess(true)
      onImportComplete?.(priceList.id)
      
      // Reset après 2 secondes
      setTimeout(() => {
        onClose()
        resetState()
      }, 2000)
    } catch (err) {
      console.error('Erreur sauvegarde:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
      setStep('mapping')
    } finally {
      setIsLoading(false)
    }
  }, [materials, listName, listDescription, listSource, file, onImportComplete, onClose])

  // Reset
  const resetState = useCallback(() => {
    setStep('upload')
    setFile(null)
    setRawData([])
    setHeaders([])
    setMaterials([])
    setColumnMapping({
      code: '',
      name: '',
      category: '',
      unit: '',
      unit_price: '',
      supplier: ''
    })
    setListName('')
    setListDescription('')
    setListSource('')
    setError(null)
    setSuccess(false)
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="text-teal-600" size={24} />
            <div>
              <h2 className="text-lg font-semibold">Importer une liste de prix</h2>
              <p className="text-sm text-gray-500">Formats supportés: Excel (.xlsx, .xls) et CSV</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Étape 1: Upload */}
          {step === 'upload' && (
            <div className="text-center py-12">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-12 hover:border-teal-500 hover:bg-teal-50 cursor-pointer transition"
              >
                {isLoading ? (
                  <Loader2 size={48} className="mx-auto mb-4 text-teal-600 animate-spin" />
                ) : (
                  <Upload size={48} className="mx-auto mb-4 text-gray-400" />
                )}
                <p className="text-lg font-medium text-gray-700">
                  Cliquez pour sélectionner un fichier
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  ou glissez-déposez ici
                </p>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <div className="mt-8 text-left">
                <h3 className="font-medium mb-3">Format attendu:</h3>
                <div className="bg-gray-50 rounded-lg p-4 text-sm">
                  <table className="w-full">
                    <thead>
                      <tr className="text-gray-600">
                        <th className="text-left pb-2">Code</th>
                        <th className="text-left pb-2">Nom</th>
                        <th className="text-left pb-2">Catégorie</th>
                        <th className="text-left pb-2">Unité</th>
                        <th className="text-left pb-2">Prix</th>
                        <th className="text-left pb-2">Fournisseur</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-500">
                      <tr>
                        <td>BET-30</td>
                        <td>Béton 30 MPa</td>
                        <td>Béton</td>
                        <td>m³</td>
                        <td>185.00</td>
                        <td>Béton ABC</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Étape 2: Preview et mapping */}
          {step === 'preview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Fichier: {file?.name}</h3>
                  <p className="text-sm text-gray-500">{rawData.length} lignes trouvées</p>
                </div>
                <button
                  onClick={resetState}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Changer de fichier
                </button>
              </div>

              {/* Mapping des colonnes */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-4">Associer les colonnes</h4>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { key: 'code', label: 'Code', required: false },
                    { key: 'name', label: 'Nom *', required: true },
                    { key: 'category', label: 'Catégorie', required: false },
                    { key: 'unit', label: 'Unité', required: false },
                    { key: 'unit_price', label: 'Prix *', required: true },
                    { key: 'supplier', label: 'Fournisseur', required: false },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-sm text-gray-600 mb-1">{label}</label>
                      <select
                        value={columnMapping[key]}
                        onChange={(e) => setColumnMapping(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      >
                        <option value="">-- Non mappé --</option>
                        {headers.map((h, i) => (
                          <option key={i} value={String(i)}>{h}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aperçu des données */}
              <div>
                <h4 className="font-medium mb-2">Aperçu (5 premières lignes)</h4>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {headers.map((h, i) => (
                          <th key={i} className="px-3 py-2 text-left font-medium text-gray-600">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rawData.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-t">
                          {headers.map((_, j) => (
                            <td key={j} className="px-3 py-2 text-gray-700">
                              {row[j] ?? '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Étape 3: Confirmation */}
          {step === 'mapping' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700 font-medium">
                  <Check size={20} />
                  {materials.length} matériaux valides trouvés
                </div>
              </div>

              {/* Métadonnées de la liste */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de la liste *
                  </label>
                  <input
                    type="text"
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Ex: Liste fournisseur ABC 2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source/Fournisseur
                  </label>
                  <input
                    type="text"
                    value={listSource}
                    onChange={(e) => setListSource(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Ex: Matériaux XYZ"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={listDescription}
                  onChange={(e) => setListDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                  placeholder="Notes sur cette liste de prix..."
                />
              </div>

              {/* Aperçu des matériaux */}
              <div>
                <h4 className="font-medium mb-2">Aperçu des matériaux à importer</h4>
                <div className="overflow-x-auto border rounded-lg max-h-64">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">Code</th>
                        <th className="px-3 py-2 text-left">Nom</th>
                        <th className="px-3 py-2 text-left">Catégorie</th>
                        <th className="px-3 py-2 text-left">Unité</th>
                        <th className="px-3 py-2 text-right">Prix</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materials.map((m, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-2 text-gray-500">{m.code}</td>
                          <td className="px-3 py-2 font-medium">{m.name}</td>
                          <td className="px-3 py-2 text-gray-500">{m.category}</td>
                          <td className="px-3 py-2">{m.unit}</td>
                          <td className="px-3 py-2 text-right">${m.unit_price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Étape 4: Saving */}
          {step === 'saving' && (
            <div className="text-center py-12">
              {success ? (
                <>
                  <Check size={64} className="mx-auto mb-4 text-green-500" />
                  <h3 className="text-xl font-medium text-green-700">Import réussi!</h3>
                  <p className="text-gray-500 mt-2">{materials.length} matériaux importés</p>
                </>
              ) : (
                <>
                  <Loader2 size={64} className="mx-auto mb-4 text-teal-600 animate-spin" />
                  <h3 className="text-xl font-medium">Importation en cours...</h3>
                  <p className="text-gray-500 mt-2">Veuillez patienter</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <button
            onClick={step === 'upload' ? onClose : () => setStep(step === 'mapping' ? 'preview' : 'upload')}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            disabled={isLoading}
          >
            {step === 'upload' ? 'Annuler' : 'Retour'}
          </button>

          {step === 'preview' && (
            <button
              onClick={applyMapping}
              disabled={!columnMapping.name || !columnMapping.unit_price}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Eye size={18} />
              Vérifier le mapping
            </button>
          )}

          {step === 'mapping' && (
            <button
              onClick={saveToDatabase}
              disabled={isLoading || materials.length === 0 || !listName}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              Importer {materials.length} matériaux
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default PriceListImporter
