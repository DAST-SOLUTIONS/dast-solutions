/**
 * DAST Solutions - WorkCrewManager
 * Gestion des équipes de travail avec membres, productivité et équipements
 */
import { useState, useCallback, useEffect } from 'react'
import {
  Users, Plus, Trash2, Edit3, Save, X, ChevronDown, ChevronUp,
  HardHat, Wrench, DollarSign, Clock, AlertCircle, Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { CCQ_TRADES } from '@/types/takeoff-measure-types'

interface CrewMember {
  id?: string
  name: string
  trade_code: string
  trade_name: string
  classification: string
  hourly_rate: number
  quantity: number
}

interface Equipment {
  id: string
  name: string
  hourly_rate: number
  quantity: number
}

interface WorkCrew {
  id: string
  name: string
  description: string
  specialty: string
  default_productivity: number
  productivity_unit: string
  hourly_cost: number
  members: CrewMember[]
  equipment: Equipment[]
}

interface WorkCrewManagerProps {
  isOpen: boolean
  onClose: () => void
  onSelectCrew?: (crew: WorkCrew) => void
}

const CLASSIFICATIONS = [
  'Compagnon',
  'Apprenti 1ère année',
  'Apprenti 2e année',
  'Apprenti 3e année',
  'Apprenti 4e année'
]

const PRODUCTIVITY_UNITS = [
  'm²/h',
  'm³/h',
  'm lin./h',
  'unité/h',
  'kg/h'
]

export function WorkCrewManager({
  isOpen,
  onClose,
  onSelectCrew
}: WorkCrewManagerProps) {
  // État
  const [crews, setCrews] = useState<WorkCrew[]>([])
  const [selectedCrew, setSelectedCrew] = useState<WorkCrew | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [expandedCrew, setExpandedCrew] = useState<string | null>(null)
  
  // Formulaire
  const [formData, setFormData] = useState<Partial<WorkCrew>>({
    name: '',
    description: '',
    specialty: '',
    default_productivity: 1,
    productivity_unit: 'm²/h',
    members: [],
    equipment: []
  })
  
  // UI
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Charger les équipes
  useEffect(() => {
    if (isOpen) {
      loadCrews()
    }
  }, [isOpen])

  const loadCrews = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data: crewsData, error: crewsError } = await supabase
        .from('work_crews')
        .select(`
          *,
          crew_members (*),
          crew_equipment (
            *,
            equipment (*)
          )
        `)
        .eq('is_active', true)
        .order('name')

      if (crewsError) throw crewsError

      const loadedCrews: WorkCrew[] = (crewsData || []).map(crew => ({
        id: crew.id,
        name: crew.name,
        description: crew.description || '',
        specialty: crew.specialty || '',
        default_productivity: crew.default_productivity || 1,
        productivity_unit: crew.productivity_unit || 'm²/h',
        hourly_cost: crew.hourly_cost || 0,
        members: (crew.crew_members || []).map((m: any) => ({
          id: m.id,
          name: m.name || '',
          trade_code: m.trade_code,
          trade_name: m.trade_name,
          classification: m.classification || 'Compagnon',
          hourly_rate: m.hourly_rate,
          quantity: m.quantity || 1
        })),
        equipment: (crew.crew_equipment || []).map((e: any) => ({
          id: e.equipment?.id || e.equipment_id,
          name: e.equipment?.name || 'Équipement',
          hourly_rate: e.equipment?.hourly_rate || 0,
          quantity: e.quantity || 1
        }))
      }))

      setCrews(loadedCrews)
    } catch (err) {
      console.error('Erreur chargement équipes:', err)
      setError('Impossible de charger les équipes')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Calculer le coût horaire total de l'équipe
  const calculateHourlyCost = useCallback((members: CrewMember[], equipment: Equipment[]): number => {
    const laborCost = members.reduce((sum, m) => sum + (m.hourly_rate * m.quantity), 0)
    const equipCost = equipment.reduce((sum, e) => sum + (e.hourly_rate * e.quantity), 0)
    return laborCost + equipCost
  }, [])

  // Ajouter un membre
  const addMember = useCallback(() => {
    const defaultTrade = CCQ_TRADES[0]
    setFormData(prev => ({
      ...prev,
      members: [
        ...(prev.members || []),
        {
          name: '',
          trade_code: defaultTrade.code,
          trade_name: defaultTrade.name,
          classification: 'Compagnon',
          hourly_rate: defaultTrade.rate,
          quantity: 1
        }
      ]
    }))
  }, [])

  // Supprimer un membre
  const removeMember = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members?.filter((_, i) => i !== index)
    }))
  }, [])

  // Mettre à jour un membre
  const updateMember = useCallback((index: number, field: keyof CrewMember, value: any) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members?.map((m, i) => {
        if (i !== index) return m
        
        // Si on change le métier, mettre à jour le taux
        if (field === 'trade_code') {
          const trade = CCQ_TRADES.find(t => t.code === value)
          return {
            ...m,
            trade_code: value,
            trade_name: trade?.name || '',
            hourly_rate: trade?.rate || m.hourly_rate
          }
        }
        
        return { ...m, [field]: value }
      })
    }))
  }, [])

  // Sauvegarder l'équipe
  const saveCrew = useCallback(async () => {
    if (!formData.name) {
      setError('Le nom de l\'équipe est requis')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const hourlyCost = calculateHourlyCost(formData.members || [], formData.equipment || [])

      if (isCreating) {
        // Créer nouvelle équipe
        const { data: newCrew, error: crewError } = await supabase
          .from('work_crews')
          .insert({
            user_id: user.id,
            name: formData.name,
            description: formData.description,
            specialty: formData.specialty,
            default_productivity: formData.default_productivity,
            productivity_unit: formData.productivity_unit,
            hourly_cost: hourlyCost
          })
          .select()
          .single()

        if (crewError) throw crewError

        // Ajouter les membres
        if (formData.members && formData.members.length > 0) {
          const { error: membersError } = await supabase
            .from('crew_members')
            .insert(formData.members.map(m => ({
              crew_id: newCrew.id,
              name: m.name,
              trade_code: m.trade_code,
              trade_name: m.trade_name,
              classification: m.classification,
              hourly_rate: m.hourly_rate,
              quantity: m.quantity
            })))

          if (membersError) throw membersError
        }
      } else if (selectedCrew) {
        // Mettre à jour équipe existante
        const { error: updateError } = await supabase
          .from('work_crews')
          .update({
            name: formData.name,
            description: formData.description,
            specialty: formData.specialty,
            default_productivity: formData.default_productivity,
            productivity_unit: formData.productivity_unit,
            hourly_cost: hourlyCost
          })
          .eq('id', selectedCrew.id)

        if (updateError) throw updateError

        // Supprimer les anciens membres et réinsérer
        await supabase
          .from('crew_members')
          .delete()
          .eq('crew_id', selectedCrew.id)

        if (formData.members && formData.members.length > 0) {
          const { error: membersError } = await supabase
            .from('crew_members')
            .insert(formData.members.map(m => ({
              crew_id: selectedCrew.id,
              name: m.name,
              trade_code: m.trade_code,
              trade_name: m.trade_name,
              classification: m.classification,
              hourly_rate: m.hourly_rate,
              quantity: m.quantity
            })))

          if (membersError) throw membersError
        }
      }

      await loadCrews()
      setIsEditing(false)
      setIsCreating(false)
      setSelectedCrew(null)
    } catch (err) {
      console.error('Erreur sauvegarde équipe:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setIsLoading(false)
    }
  }, [formData, isCreating, selectedCrew, calculateHourlyCost, loadCrews])

  // Supprimer une équipe
  const deleteCrew = useCallback(async (crewId: string) => {
    if (!confirm('Supprimer cette équipe?')) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('work_crews')
        .update({ is_active: false })
        .eq('id', crewId)

      if (error) throw error
      
      await loadCrews()
    } catch (err) {
      console.error('Erreur suppression:', err)
      setError('Impossible de supprimer l\'équipe')
    } finally {
      setIsLoading(false)
    }
  }, [loadCrews])

  // Commencer la création
  const startCreating = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      specialty: '',
      default_productivity: 1,
      productivity_unit: 'm²/h',
      members: [],
      equipment: []
    })
    setIsCreating(true)
    setIsEditing(true)
    setSelectedCrew(null)
  }, [])

  // Commencer l'édition
  const startEditing = useCallback((crew: WorkCrew) => {
    setFormData({
      name: crew.name,
      description: crew.description,
      specialty: crew.specialty,
      default_productivity: crew.default_productivity,
      productivity_unit: crew.productivity_unit,
      members: [...crew.members],
      equipment: [...crew.equipment]
    })
    setSelectedCrew(crew)
    setIsEditing(true)
    setIsCreating(false)
  }, [])

  // Annuler
  const cancelEdit = useCallback(() => {
    setIsEditing(false)
    setIsCreating(false)
    setSelectedCrew(null)
    setError(null)
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Users className="text-teal-600" size={24} />
            <div>
              <h2 className="text-lg font-semibold">Équipes de travail</h2>
              <p className="text-sm text-gray-500">Gérer les équipes, membres et productivité</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Liste des équipes */}
          <div className={`border-r overflow-y-auto ${isEditing ? 'w-1/3' : 'w-full'}`}>
            <div className="p-4">
              <button
                onClick={startCreating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                <Plus size={18} />
                Nouvelle équipe
              </button>
            </div>

            {isLoading && crews.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={32} className="animate-spin text-teal-600" />
              </div>
            ) : crews.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users size={48} className="mx-auto mb-4 opacity-50" />
                <p>Aucune équipe</p>
              </div>
            ) : (
              <div className="space-y-2 px-4 pb-4">
                {crews.map(crew => (
                  <div
                    key={crew.id}
                    className={`border rounded-lg overflow-hidden ${
                      selectedCrew?.id === crew.id ? 'border-teal-500' : 'border-gray-200'
                    }`}
                  >
                    <div
                      onClick={() => setExpandedCrew(expandedCrew === crew.id ? null : crew.id)}
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                    >
                      <div>
                        <div className="font-medium">{crew.name}</div>
                        <div className="text-sm text-gray-500">
                          {crew.members.length} membre(s) • ${crew.hourly_cost.toFixed(2)}/h
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {onSelectCrew && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onSelectCrew(crew)
                              onClose()
                            }}
                            className="p-1.5 text-teal-600 hover:bg-teal-50 rounded"
                            title="Sélectionner"
                          >
                            <HardHat size={16} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            startEditing(crew)
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteCrew(crew.id)
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                        {expandedCrew === crew.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {expandedCrew === crew.id && (
                      <div className="p-3 pt-0 text-sm">
                        <div className="border-t pt-3 space-y-2">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock size={14} />
                            Productivité: {crew.default_productivity} {crew.productivity_unit}
                          </div>
                          {crew.specialty && (
                            <div className="text-gray-500">Spécialité: {crew.specialty}</div>
                          )}
                          <div className="mt-2">
                            <div className="font-medium text-gray-700 mb-1">Membres:</div>
                            {crew.members.map((m, i) => (
                              <div key={i} className="flex justify-between text-gray-600">
                                <span>{m.quantity}x {m.trade_name}</span>
                                <span>${m.hourly_rate.toFixed(2)}/h</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formulaire d'édition */}
          {isEditing && (
            <div className="w-2/3 overflow-y-auto p-6">
              <h3 className="text-lg font-medium mb-4">
                {isCreating ? 'Nouvelle équipe' : `Modifier: ${selectedCrew?.name}`}
              </h3>

              <div className="space-y-4">
                {/* Infos de base */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom de l'équipe *
                    </label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Ex: Équipe coffrage A"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Spécialité
                    </label>
                    <input
                      type="text"
                      value={formData.specialty || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Ex: Coffrage"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={2}
                  />
                </div>

                {/* Productivité */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Productivité par défaut
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.default_productivity || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, default_productivity: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unité de productivité
                    </label>
                    <select
                      value={formData.productivity_unit || 'm²/h'}
                      onChange={(e) => setFormData(prev => ({ ...prev, productivity_unit: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {PRODUCTIVITY_UNITS.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Membres */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Membres de l'équipe
                    </label>
                    <button
                      onClick={addMember}
                      className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Ajouter
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(formData.members || []).map((member, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 grid grid-cols-4 gap-2">
                          <select
                            value={member.trade_code}
                            onChange={(e) => updateMember(index, 'trade_code', e.target.value)}
                            className="px-2 py-1.5 border rounded text-sm"
                          >
                            {CCQ_TRADES.map(t => (
                              <option key={t.code} value={t.code}>{t.name}</option>
                            ))}
                          </select>
                          <select
                            value={member.classification}
                            onChange={(e) => updateMember(index, 'classification', e.target.value)}
                            className="px-2 py-1.5 border rounded text-sm"
                          >
                            {CLASSIFICATIONS.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-500">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={member.hourly_rate}
                              onChange={(e) => updateMember(index, 'hourly_rate', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 border rounded text-sm"
                            />
                            <span className="text-sm text-gray-500">/h</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-500">Qté:</span>
                            <input
                              type="number"
                              min="1"
                              value={member.quantity}
                              onChange={(e) => updateMember(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-16 px-2 py-1.5 border rounded text-sm"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => removeMember(index)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}

                    {(!formData.members || formData.members.length === 0) && (
                      <div className="text-center py-4 text-gray-400 border-2 border-dashed rounded-lg">
                        Aucun membre
                      </div>
                    )}
                  </div>
                </div>

                {/* Coût total calculé */}
                <div className="p-4 bg-teal-50 rounded-lg">
                  <div className="flex items-center gap-2 text-teal-700">
                    <DollarSign size={20} />
                    <span className="font-medium">Coût horaire total:</span>
                    <span className="text-xl font-bold">
                      ${calculateHourlyCost(formData.members || [], formData.equipment || []).toFixed(2)}/h
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {isEditing && (
          <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
            <button
              onClick={cancelEdit}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              onClick={saveCrew}
              disabled={isLoading || !formData.name}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Sauvegarder
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default WorkCrewManager
