/**
 * DAST Solutions - Base de données Prix Matériaux Québec
 * Option A - Fondation du système d'estimation
 */
import { useState, useMemo } from 'react'
import { useMaterials } from '@/hooks/useMaterials'
import { PageTitle } from '@/components/PageTitle'
import {
  Search, Filter, Plus, Star, StarOff, Edit2, Trash2, 
  Download, Upload, Package, DollarSign, Percent,
  ChevronDown, ChevronRight, X, Save, Loader2,
  Building2, Hammer, Zap, Wrench, LayoutGrid, List
} from 'lucide-react'
import type { Material, MaterialCategory, MaterialFilters } from '@/types/pricing-types'

const PRICE_TYPES = [
  { value: 'material', label: 'Matériau', icon: Package, color: 'bg-blue-100 text-blue-700' },
  { value: 'labor', label: 'Main-d\'œuvre', icon: Hammer, color: 'bg-green-100 text-green-700' },
  { value: 'equipment', label: 'Équipement', icon: Wrench, color: 'bg-orange-100 text-orange-700' },
  { value: 'subcontract', label: 'Sous-traitance', icon: Building2, color: 'bg-purple-100 text-purple-700' },
]

const DIVISIONS = [
  { code: '03', name: 'Béton', icon: '🧱' },
  { code: '04', name: 'Maçonnerie', icon: '🏗️' },
  { code: '05', name: 'Métaux', icon: '🔩' },
  { code: '06', name: 'Bois et plastiques', icon: '🪵' },
  { code: '07', name: 'Isolation et étanchéité', icon: '🏠' },
  { code: '08', name: 'Portes et fenêtres', icon: '🚪' },
  { code: '09', name: 'Finitions', icon: '🎨' },
  { code: '10', name: 'Spécialités', icon: '📋' },
  { code: '22', name: 'Plomberie', icon: '🚿' },
  { code: '23', name: 'CVCA', icon: '❄️' },
  { code: '26', name: 'Électricité', icon: '⚡' },
  { code: '31', name: 'Terrassement', icon: '🚜' },
  { code: '32', name: 'Aménagement extérieur', icon: '🌳' },
]

export default function MaterialDatabase() {
  const {
    materials,
    categories,
    loading,
    filters,
    setFilters,
    suppliers,
    toggleFavorite,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    calculatePrice,
    refresh
  } = useMaterials()

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [priceCalculator, setPriceCalculator] = useState<{ material: Material; quantity: number } | null>(null)

  // Grouper par catégorie
  const groupedMaterials = useMemo(() => {
    const grouped: Record<string, Material[]> = {}
    
    materials.forEach(mat => {
      const divCode = mat.category?.division_code || 'Autre'
      if (!grouped[divCode]) grouped[divCode] = []
      grouped[divCode].push(mat)
    })
    
    return grouped
  }, [materials])

  // Statistiques
  const stats = useMemo(() => ({
    total: materials.length,
    favorites: materials.filter(m => m.is_favorite).length,
    materials: materials.filter(m => m.price_type === 'material').length,
    labor: materials.filter(m => m.price_type === 'labor').length,
  }), [materials])

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(amount)

  const handleSearch = (query: string) => {
    setFilters({ ...filters, search: query })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce matériau?')) return
    await deleteMaterial(id)
  }

  return (
    <div className="space-y-6">
      <PageTitle 
        title="Prix Matériaux Québec" 
        subtitle={`${stats.total} items • Base de données CSC MasterFormat`}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Package className="text-teal-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Items total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="text-yellow-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.favorites}</p>
              <p className="text-sm text-gray-500">Favoris</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.materials}</p>
              <p className="text-sm text-gray-500">Matériaux</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Hammer className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.labor}</p>
              <p className="text-sm text-gray-500">Main-d'œuvre</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher par nom, code ou description..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2 flex-wrap">
            <select
              value={filters.price_type || ''}
              onChange={(e) => setFilters({ ...filters, price_type: e.target.value || undefined })}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Tous les types</option>
              {PRICE_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>

            <select
              value={filters.supplier || ''}
              onChange={(e) => setFilters({ ...filters, supplier: e.target.value || undefined })}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Tous fournisseurs</option>
              {suppliers.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <button
              onClick={() => setFilters({ ...filters, is_favorite: !filters.is_favorite })}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors
                ${filters.is_favorite ? 'bg-yellow-50 border-yellow-300 text-yellow-700' : 'hover:bg-gray-50'}`}
            >
              <Star size={16} fill={filters.is_favorite ? 'currentColor' : 'none'} />
              Favoris
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
            >
              <Filter size={16} />
              Plus de filtres
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-teal-50 text-teal-600' : 'hover:bg-gray-50'}`}
            >
              <List size={20} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-teal-50 text-teal-600' : 'hover:bg-gray-50'}`}
            >
              <LayoutGrid size={20} />
            </button>
          </div>

          {/* Actions */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <Plus size={20} />
            Ajouter
          </button>
        </div>

        {/* Division Quick Select */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedDivision(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
              ${!selectedDivision ? 'bg-teal-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            Toutes divisions
          </button>
          {DIVISIONS.map(div => (
            <button
              key={div.code}
              onClick={() => setSelectedDivision(div.code === selectedDivision ? null : div.code)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                ${selectedDivision === div.code ? 'bg-teal-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              <span>{div.icon}</span>
              <span>{div.code} - {div.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Materials List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-teal-600" size={32} />
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unité</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Prix</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Perte %</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fournisseur</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {materials
                .filter(m => !selectedDivision || m.category?.division_code === selectedDivision)
                .map(material => {
                  const priceType = PRICE_TYPES.find(t => t.value === material.price_type)
                  return (
                    <tr key={material.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <code className="text-sm bg-gray-100 px-2 py-0.5 rounded">{material.code}</code>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleFavorite(material.id)}
                            className={`p-1 rounded ${material.is_favorite ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-500'}`}
                          >
                            <Star size={16} fill={material.is_favorite ? 'currentColor' : 'none'} />
                          </button>
                          <div>
                            <p className="font-medium text-gray-900">{material.name}</p>
                            {material.description && (
                              <p className="text-xs text-gray-500 truncate max-w-xs">{material.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {priceType && (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${priceType.color}`}>
                            <priceType.icon size={12} />
                            {priceType.label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {material.unit_fr || material.unit}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {formatCurrency(material.unit_price)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {material.waste_factor > 0 ? (
                          <span className="inline-flex items-center gap-1 text-sm text-orange-600">
                            <Percent size={12} />
                            {material.waste_factor}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {material.supplier || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setPriceCalculator({ material, quantity: 1 })}
                            className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded"
                            title="Calculer prix"
                          >
                            <DollarSign size={16} />
                          </button>
                          <button
                            onClick={() => setEditingMaterial(material)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Modifier"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(material.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>

          {materials.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Aucun matériau trouvé
            </div>
          )}
        </div>
      ) : (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {materials
            .filter(m => !selectedDivision || m.category?.division_code === selectedDivision)
            .map(material => {
              const priceType = PRICE_TYPES.find(t => t.value === material.price_type)
              return (
                <div key={material.id} className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{material.code}</code>
                    <button
                      onClick={() => toggleFavorite(material.id)}
                      className={`p-1 rounded ${material.is_favorite ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-500'}`}
                    >
                      <Star size={16} fill={material.is_favorite ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  
                  <h3 className="mt-2 font-medium text-gray-900 line-clamp-2">{material.name}</h3>
                  
                  {priceType && (
                    <span className={`inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-xs font-medium ${priceType.color}`}>
                      <priceType.icon size={12} />
                      {priceType.label}
                    </span>
                  )}

                  <div className="mt-3 pt-3 border-t flex items-end justify-between">
                    <div>
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(material.unit_price)}</p>
                      <p className="text-xs text-gray-500">/ {material.unit_fr || material.unit}</p>
                    </div>
                    {material.waste_factor > 0 && (
                      <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                        +{material.waste_factor}% perte
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setPriceCalculator({ material, quantity: 1 })}
                      className="flex-1 py-1.5 text-sm text-teal-600 bg-teal-50 rounded hover:bg-teal-100"
                    >
                      Calculer
                    </button>
                    <button
                      onClick={() => setEditingMaterial(material)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {/* Price Calculator Modal */}
      {priceCalculator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">Calculateur de prix</h3>
              <button
                onClick={() => setPriceCalculator(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <p className="font-medium text-gray-900">{priceCalculator.material.name}</p>
                <p className="text-sm text-gray-500">{priceCalculator.material.code}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={priceCalculator.quantity}
                    onChange={(e) => setPriceCalculator({ ...priceCalculator, quantity: parseFloat(e.target.value) || 0 })}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    min="0"
                    step="0.01"
                  />
                  <span className="text-gray-500">{priceCalculator.material.unit_fr || priceCalculator.material.unit}</span>
                </div>
              </div>

              {(() => {
                const calc = calculatePrice(priceCalculator.material, priceCalculator.quantity)
                return (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Prix unitaire:</span>
                      <span className="font-medium">{formatCurrency(calc.unit_price)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Quantité:</span>
                      <span className="font-medium">{calc.quantity}</span>
                    </div>
                    {priceCalculator.material.waste_factor > 0 && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Perte ({priceCalculator.material.waste_factor}%):</span>
                          <span className="text-orange-600">+{(calc.adjusted_quantity - calc.quantity).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Quantité ajustée:</span>
                          <span className="font-medium">{calc.adjusted_quantity.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between text-lg pt-2 border-t">
                      <span className="font-medium text-gray-900">Total:</span>
                      <span className="font-bold text-teal-600">{formatCurrency(calc.total_price)}</span>
                    </div>
                  </div>
                )
              })()}
            </div>

            <div className="flex gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => setPriceCalculator(null)}
                className="flex-1 py-2 border rounded-lg text-gray-700 hover:bg-white"
              >
                Fermer
              </button>
              <button
                className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                Ajouter à l'estimation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal - Simplified for now */}
      {showAddModal && (
        <MaterialFormModal
          onClose={() => setShowAddModal(false)}
          onSave={createMaterial}
          categories={categories}
        />
      )}

      {editingMaterial && (
        <MaterialFormModal
          material={editingMaterial}
          onClose={() => setEditingMaterial(null)}
          onSave={(data) => updateMaterial(editingMaterial.id, data)}
          categories={categories}
        />
      )}
    </div>
  )
}

// Material Form Modal Component
function MaterialFormModal({ 
  material, 
  onClose, 
  onSave, 
  categories 
}: { 
  material?: Material
  onClose: () => void
  onSave: (data: Partial<Material>) => Promise<{ error: string | null }>
  categories: MaterialCategory[]
}) {
  const [formData, setFormData] = useState({
    code: material?.code || '',
    name: material?.name || '',
    description: material?.description || '',
    category_id: material?.category_id || '',
    unit: material?.unit || '',
    unit_fr: material?.unit_fr || '',
    unit_price: material?.unit_price || 0,
    price_type: material?.price_type || 'material',
    waste_factor: material?.waste_factor || 0,
    supplier: material?.supplier || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const result = await onSave(formData)
    
    if (result.error) {
      setError(result.error)
      setSaving(false)
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h3 className="font-semibold text-gray-900">
            {material ? 'Modifier le matériau' : 'Nouveau matériau'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Sélectionner...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.division_code} - {cat.subdivision_name || cat.division_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unité *</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="pi², m, kg..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unité (FR)</label>
              <input
                type="text"
                value={formData.unit_fr}
                onChange={(e) => setFormData({ ...formData, unit_fr: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="pied carré..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formData.price_type}
                onChange={(e) => setFormData({ ...formData, price_type: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                {PRICE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prix unitaire *</label>
              <input
                type="number"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Perte (%)</label>
              <input
                type="number"
                value={formData.waste_factor}
                onChange={(e) => setFormData({ ...formData, waste_factor: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                min="0"
                max="100"
                step="0.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
