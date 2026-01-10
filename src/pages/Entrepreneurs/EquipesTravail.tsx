/**
 * DAST Solutions - Équipes de Travail
 * Lié avec Estimation/Soumission pour créer des équipes
 */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, Users, Plus, Search, Edit2, Trash2, Mail, Phone,
  Building2, Star, Filter, MoreVertical, UserPlus, Settings,
  CheckCircle, XCircle, Clock, Briefcase, Award
} from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  company: string
  trade: string
  email: string
  phone: string
  license_rbq?: string
  rating: number
  status: 'active' | 'inactive' | 'pending'
  projects_count: number
  last_collaboration?: string
  notes?: string
}

interface WorkTeam {
  id: string
  name: string
  description: string
  project_type: string
  members: TeamMember[]
  created_at: string
}

const TRADES = [
  'Entrepreneur général',
  'Maçonnerie',
  'Béton',
  'Charpente',
  'Électricité',
  'Plomberie',
  'CVAC',
  'Toiture',
  'Revêtement extérieur',
  'Finition intérieure',
  'Peinture',
  'Plancher',
  'Excavation',
  'Paysagement',
]

export default function EquipesTravail() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState<WorkTeam[]>([])
  const [members, setMembers] = useState<TeamMember[]>([])
  const [activeTab, setActiveTab] = useState<'teams' | 'members'>('teams')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTrade, setFilterTrade] = useState('')
  const [showAddMember, setShowAddMember] = useState(false)
  const [showAddTeam, setShowAddTeam] = useState(false)

  const [newMember, setNewMember] = useState({
    name: '',
    company: '',
    trade: '',
    email: '',
    phone: '',
    license_rbq: '',
    notes: ''
  })

  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    project_type: '',
    member_ids: [] as string[]
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Charger les membres
      const { data: membersData } = await supabase
        .from('work_team_members')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      setMembers(membersData || [])

      // Charger les équipes
      const { data: teamsData } = await supabase
        .from('work_teams')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      setTeams(teamsData || [])

    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.trade) return
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('work_team_members').insert({
      user_id: user.id,
      ...newMember,
      rating: 5,
      status: 'active',
      projects_count: 0
    })

    setShowAddMember(false)
    setNewMember({ name: '', company: '', trade: '', email: '', phone: '', license_rbq: '', notes: '' })
    loadData()
  }

  const handleAddTeam = async () => {
    if (!newTeam.name) return
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('work_teams').insert({
      user_id: user.id,
      name: newTeam.name,
      description: newTeam.description,
      project_type: newTeam.project_type,
      members: newTeam.member_ids
    })

    setShowAddTeam(false)
    setNewTeam({ name: '', description: '', project_type: '', member_ids: [] })
    loadData()
  }

  const filteredMembers = members.filter(m => {
    if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !m.company?.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterTrade && m.trade !== filterTrade) return false
    return true
  })

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Actif' },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Inactif' },
      pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'En attente' }
    }
    const config = configs[status] || configs.pending
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            size={14}
            className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="text-teal-600" />
              Équipes de Travail
            </h1>
            <p className="text-gray-500">Gérez vos sous-traitants et équipes pour les soumissions</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddMember(true)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <UserPlus size={16} />
            Ajouter membre
          </button>
          <button
            onClick={() => setShowAddTeam(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
          >
            <Plus size={16} />
            Nouvelle équipe
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Users className="text-teal-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{members.length}</p>
              <p className="text-sm text-gray-500">Membres</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Briefcase className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{teams.length}</p>
              <p className="text-sm text-gray-500">Équipes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{members.filter(m => m.status === 'active').length}</p>
              <p className="text-sm text-gray-500">Actifs</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Award className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{members.filter(m => m.license_rbq).length}</p>
              <p className="text-sm text-gray-500">Licenciés RBQ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('teams')}
          className={`pb-3 px-1 border-b-2 transition ${
            activeTab === 'teams' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500'
          }`}
        >
          Équipes ({teams.length})
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`pb-3 px-1 border-b-2 transition ${
            activeTab === 'members' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500'
          }`}
        >
          Tous les membres ({members.length})
        </button>
      </div>

      {activeTab === 'members' && (
        <>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un membre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
            <select
              value={filterTrade}
              onChange={(e) => setFilterTrade(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">Tous les métiers</option>
              {TRADES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Members List */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Nom / Entreprise</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Métier</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Contact</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500">Évaluation</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500">Statut</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredMembers.map(member => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{member.name}</p>
                        {member.company && (
                          <p className="text-sm text-gray-500">{member.company}</p>
                        )}
                        {member.license_rbq && (
                          <span className="text-xs text-blue-600">RBQ: {member.license_rbq}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">{member.trade}</td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        {member.email && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <Mail size={12} />
                            {member.email}
                          </div>
                        )}
                        {member.phone && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <Phone size={12} />
                            {member.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {renderStars(member.rating)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(member.status)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1.5 hover:bg-gray-100 rounded">
                          <Edit2 size={14} className="text-gray-500" />
                        </button>
                        <button className="p-1.5 hover:bg-gray-100 rounded">
                          <Trash2 size={14} className="text-gray-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredMembers.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Aucun membre trouvé
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'teams' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              <Users className="mx-auto mb-2 text-gray-300" size={48} />
              <p>Aucune équipe créée</p>
              <button 
                onClick={() => setShowAddTeam(true)}
                className="mt-2 text-teal-600 hover:underline"
              >
                Créer une équipe
              </button>
            </div>
          ) : (
            teams.map(team => (
              <div key={team.id} className="bg-white rounded-xl border p-4 hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{team.name}</h3>
                    {team.project_type && (
                      <span className="text-xs text-gray-500">{team.project_type}</span>
                    )}
                  </div>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreVertical size={16} className="text-gray-400" />
                  </button>
                </div>
                
                {team.description && (
                  <p className="text-sm text-gray-600 mb-3">{team.description}</p>
                )}
                
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users size={14} />
                  <span>{(team.members || []).length} membres</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal Ajouter Membre */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold mb-4">Ajouter un membre</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom *</label>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Entreprise</label>
                <input
                  type="text"
                  value={newMember.company}
                  onChange={(e) => setNewMember({...newMember, company: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Métier *</label>
                <select
                  value={newMember.trade}
                  onChange={(e) => setNewMember({...newMember, trade: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Sélectionner...</option>
                  {TRADES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Courriel</label>
                  <input
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={newMember.phone}
                    onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Licence RBQ</label>
                <input
                  type="text"
                  value={newMember.license_rbq}
                  onChange={(e) => setNewMember({...newMember, license_rbq: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="XXXX-XXXX-XX"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button 
                onClick={() => setShowAddMember(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAddMember}
                disabled={!newMember.name || !newMember.trade}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajouter Équipe */}
      {showAddTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold mb-4">Nouvelle équipe</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom de l'équipe *</label>
                <input
                  type="text"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Ex: Équipe résidentielle"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Type de projet</label>
                <select
                  value={newTeam.project_type}
                  onChange={(e) => setNewTeam({...newTeam, project_type: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Sélectionner...</option>
                  <option value="residential">Résidentiel</option>
                  <option value="commercial">Commercial</option>
                  <option value="institutional">Institutionnel</option>
                  <option value="industrial">Industriel</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newTeam.description}
                  onChange={(e) => setNewTeam({...newTeam, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button 
                onClick={() => setShowAddTeam(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAddTeam}
                disabled={!newTeam.name}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
