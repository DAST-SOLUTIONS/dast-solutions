/**
 * DAST Solutions - Base de Prix Matériaux
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Package, Plus, Search, Edit, Trash2, X, Upload, Download,
  DollarSign, Filter, FileSpreadsheet, Check
} from 'lucide-react'
import * as XLSX from 'xlsx'

interface MaterialPrice {
  id: string
  code?: string
  name: string
  description?: string
  division?: string
  section?: string
  unit_price: number
  unit: string
  supplier?: string
  effective_date: string
  created_at: string
}

const DIVISIONS = [
  { code: '03', name: 'Béton' },
  { code: '04', name: 'Maçonnerie' },
  { code: '05', name: 'Métaux' },
  { code: '06', name: 'Bois, plastiques' },
  { code: '07', name: 'Protection thermique' },
  { code: '08', name: 'Ouvertures' },
  { code: '09', name: 'Finitions' },
  { code: '22', name: 'Plomberie' },
  { code: '23', name: 'CVCA' },
  { code: '26', name: 'Électricité' },
  { code: '31', name: 'Terrassement' }
]

const UNITS = ['pi²', 'm²', 'pi', 'm', 'unité', 'kg', 'lb', 'hr', 'jour', 'forfait']

export default function MaterialPricesPage() {
  const [materials, setMaterials] = useState<MaterialPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<MaterialPrice | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDivision, setFilterDivision] = useState('')

  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    division: '',
    section: '',
    unit_price: '',
    unit: 'pi²',
    supplier: ''
  })

  useEffect(() => {
    loadMaterials()
  }, [])

  const loadMaterials = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('material_prices')
        .select('*')
        .eq('user_id', user.id)
        .order('division', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      setMaterials(data || [])
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredMaterials = materials.filter(m => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!m.name.toLowerCase().includes(q) && !m.code?.toLowerCase().includes(q)) return false
    }
    if (filterDivision && m.division !== filterDivision) return false
    return true
  })

  const openModal = (material?: MaterialPrice) => {
    if (material) {
      setEditingMaterial(material)
      setForm({
        code: material.code || '',
        name: material.name,
        description: material.description || '',
        division: material.division || '',
        section: material.section || '',
        unit_price: material.unit_price.toString(),
        unit: material.unit,
        supplier: material.supplier || ''
      })
    } else {
      setEditingMaterial(null)
      setForm({
        code: '',
        name: '',
        description: '',
        division: '',
        section: '',
        unit_price: '',
        unit: 'pi²',
        supplier: ''
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const materialData = {
        code: form.code || null,
        name: form.name,
        description: form.description || null,
        division: form.division || null,
        section: form.section || null,
        unit_price: parseFloat(form.unit_price),
        unit: form.unit,
        supplier: form.supplier || null,
        effective_date: new Date().toISOString().split('T')[0]
      }

      if (editingMaterial) {
        await supabase
          .from('material_prices')
          .update({ ...materialData, updated_at: new Date().toISOString() })
          .eq('id', editingMaterial.id)
      } else {
        await supabase
          .from('material_prices')
          .insert({ ...materialData, user_id: user.id })
      }

      await loadMaterials()
      setShowModal(false)
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce matériau?')) return

    await supabase.from('material_prices').delete().eq('id', id)
    await loadMaterials()
  }

  const exportExcel = () => {
    const data = materials.map(m => ({
      'Code': m.code || '',
      'Nom': m.name,
      'Description': m.description || '',
      'Division': m.division || '',
      'Prix': m.unit_price,
      'Unité': m.unit,
      'Fournisseur': m.supplier || ''
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Prix Matériaux')
    XLSX.writeFile(wb, 'prix_materiaux.xlsx')
  }

  const importExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(sheet) as any[]

        const materials = rows.map(row => ({
          user_id: user.id,
          code: row['Code'] || row['code'] || null,
          name: row['Nom'] || row['name'] || row['Name'] || 'Sans nom',
          description: row['Description'] || row['description'] || null,
          division: row['Division'] || row['division'] || null,
          unit_price: parseFloat(row['Prix'] || row['price'] || row['Unit Price'] || 0),
          unit: row['Unité'] || row['unit'] || 'pi²',
          supplier: row['Fournisseur'] || row['supplier'] || null,
          effective_date: new Date().toISOString().split('T')[0]
        }))

        await supabase.from('material_prices').insert(materials)
        await loadMaterials()
        alert(`${materials.length} matériaux importés!`)
      } catch (err) {
        console.error('Erreur import:', err)
        alert('Erreur lors de l\'import')
      }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prix des matériaux</h1>
          <p className="text-gray-600">Base de données de prix pour estimation</p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={importExcel}
            className="hidden"
            id="import-file"
          />
          <label htmlFor="import-file" className="btn btn-secondary cursor-pointer">
            <Upload size={16} className="mr-1" /> Importer
          </label>
          <button onClick={exportExcel} className="btn btn-secondary">
            <Download size={16} className="mr-1" /> Exporter
          </button>
          <button onClick={() => openModal()} className="btn btn-primary">
            <Plus size={16} className="mr-1" /> Ajouter
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
              <Package className="text-teal-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{materials.length}</p>
              <p className="text-sm text-gray-500">Matériaux</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileSpreadsheet className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{new Set(materials.map(m => m.division).filter(Boolean)).size}</p>
              <p className="text-sm text-gray-500">Divisions</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <DollarSign className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {materials.length > 0 
                  ? (materials.reduce((sum, m) => sum + m.unit_price, 0) / materials.length).toFixed(2)
                  : '0.00'} $
              </p>
              <p className="text-sm text-gray-500">Prix moyen</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher un matériau..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <select
            value={filterDivision}
            onChange={(e) => setFilterDivision(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">Toutes les divisions</option>
            {DIVISIONS.map(d => (
              <option key={d.code} value={d.code}>{d.code} - {d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Code</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Matériau</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Division</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Prix</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Unité</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Fournisseur</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">Chargement...</td>
              </tr>
            ) : filteredMaterials.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  <Package className="mx-auto mb-2" size={32} />
                  <p>Aucun matériau</p>
                </td>
              </tr>
            ) : (
              filteredMaterials.map(material => (
                <tr key={material.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500 font-mono">{material.code || '-'}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{material.name}</p>
                    {material.description && (
                      <p className="text-sm text-gray-500 truncate max-w-xs">{material.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {material.division && (
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                        {material.division}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {material.unit_price.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">/{material.unit}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{material.supplier || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openModal(material)} className="p-1.5 hover:bg-gray-100 rounded">
                        <Edit size={16} className="text-gray-500" />
                      </button>
                      <button onClick={() => handleDelete(material.id)} className="p-1.5 hover:bg-red-50 rounded">
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">
                {editingMaterial ? 'Modifier le matériau' : 'Nouveau matériau'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Code</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="ex: BET-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Division</label>
                  <select
                    value={form.division}
                    onChange={(e) => setForm({ ...form, division: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Sélectionner...</option>
                    {DIVISIONS.map(d => (
                      <option key={d.code} value={d.code}>{d.code} - {d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nom *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Prix unitaire *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.unit_price}
                    onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unité *</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    {UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Fournisseur</label>
                <input
                  type="text"
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">
                  Annuler
                </button>
                <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg">
                  {editingMaterial ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
