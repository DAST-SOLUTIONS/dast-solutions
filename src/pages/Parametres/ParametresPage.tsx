/**
 * DAST Solutions - Page Paramètres
 * Profil, Entreprise (admin), Abonnements (admin)
 */
import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  Settings, User, Building2, CreditCard, Bell, Link as LinkIcon,
  Users, Shield, Save, Upload, Check, AlertTriangle, X
} from 'lucide-react'

export default function ParametresPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'profil'
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(true)
  
  // Profil utilisateur
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    job_title: '',
    avatar_url: ''
  })
  
  // Profil entreprise
  const [company, setCompany] = useState({
    name: '',
    logo_url: '',
    address: '',
    city: '',
    province: 'QC',
    postal_code: '',
    phone: '',
    email: '',
    website: '',
    license_rbq: '',
    neq: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Profil utilisateur
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (profileData) {
          setProfile({
            full_name: profileData.full_name || '',
            email: user.email || '',
            phone: profileData.phone || '',
            job_title: profileData.job_title || '',
            avatar_url: profileData.avatar_url || ''
          })
        }

        // Profil entreprise
        const { data: companyData } = await supabase
          .from('company_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (companyData) {
          setCompany(companyData)
        }
      }
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)

    await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        full_name: profile.full_name,
        phone: profile.phone,
        job_title: profile.job_title,
        avatar_url: profile.avatar_url,
        updated_at: new Date().toISOString()
      })

    setSaving(false)
  }

  const handleSaveCompany = async () => {
    if (!user) return
    setSaving(true)

    await supabase
      .from('company_profiles')
      .upsert({
        user_id: user.id,
        ...company,
        updated_at: new Date().toISOString()
      })

    setSaving(false)
  }

  const tabs = [
    { id: 'profil', label: 'Mon profil', icon: User, adminOnly: false },
    { id: 'entreprise', label: 'Profil entreprise', icon: Building2, adminOnly: true },
    { id: 'utilisateurs', label: 'Utilisateurs', icon: Users, adminOnly: true },
    { id: 'abonnements', label: 'Abonnements', icon: CreditCard, adminOnly: true },
    { id: 'integrations', label: 'Intégrations', icon: LinkIcon, adminOnly: false },
    { id: 'notifications', label: 'Notifications', icon: Bell, adminOnly: false },
  ]

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
        <Settings className="text-teal-600" />
        Paramètres
      </h1>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-48 space-y-1">
          {tabs.filter(t => !t.adminOnly || isAdmin).map(t => (
            <button
              key={t.id}
              onClick={() => navigate(`/parametres/${t.id}`)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition ${
                tab === t.id 
                  ? 'bg-teal-50 text-teal-700' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Profil */}
          {tab === 'profil' && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-6">Mon profil</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User size={32} className="text-teal-600" />
                    )}
                  </div>
                  <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
                    <Upload size={16} />
                    Changer photo
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nom complet</label>
                    <input
                      type="text"
                      value={profile.full_name}
                      onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Courriel</label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Téléphone</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Poste</label>
                    <input
                      type="text"
                      value={profile.job_title}
                      onChange={(e) => setProfile({...profile, job_title: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Save size={16} />
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Entreprise (admin only) */}
          {tab === 'entreprise' && isAdmin && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-6">Profil entreprise</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                    {company.logo_url ? (
                      <img src={company.logo_url} alt="" className="w-full h-full rounded-lg object-cover" />
                    ) : (
                      <Building2 size={32} className="text-gray-400" />
                    )}
                  </div>
                  <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
                    <Upload size={16} />
                    Changer logo
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Nom de l'entreprise *</label>
                    <input
                      type="text"
                      value={company.name}
                      onChange={(e) => setCompany({...company, name: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Adresse</label>
                    <input
                      type="text"
                      value={company.address}
                      onChange={(e) => setCompany({...company, address: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Ville</label>
                    <input
                      type="text"
                      value={company.city}
                      onChange={(e) => setCompany({...company, city: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Code postal</label>
                    <input
                      type="text"
                      value={company.postal_code}
                      onChange={(e) => setCompany({...company, postal_code: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Téléphone</label>
                    <input
                      type="tel"
                      value={company.phone}
                      onChange={(e) => setCompany({...company, phone: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Courriel</label>
                    <input
                      type="email"
                      value={company.email}
                      onChange={(e) => setCompany({...company, email: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Licence RBQ</label>
                    <input
                      type="text"
                      value={company.license_rbq}
                      onChange={(e) => setCompany({...company, license_rbq: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="XXXX-XXXX-XX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">NEQ</label>
                    <input
                      type="text"
                      value={company.neq}
                      onChange={(e) => setCompany({...company, neq: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleSaveCompany}
                    disabled={saving}
                    className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Save size={16} />
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Abonnements (admin only) */}
          {tab === 'abonnements' && isAdmin && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-semibold mb-4">Plan actuel</h2>
                
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-teal-700">Plan Professionnel</h3>
                      <p className="text-sm text-teal-600">Tous les modules inclus</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-teal-700">149$/mois</p>
                      <p className="text-xs text-teal-600">Facturé annuellement</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-semibold mb-4">Plans disponibles</h2>
                
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { name: 'Takeoff', price: 49, features: ['Takeoff 2D/3D', 'OCR Plans', 'Export Excel'] },
                    { name: 'Estimation', price: 99, features: ['Takeoff inclus', 'Base de coûts', 'Soumissions', 'Comparatifs'] },
                    { name: 'Complet', price: 149, features: ['Tout inclus', 'Gestion projet', 'CRM', 'Analytics', 'Support prioritaire'] },
                  ].map(plan => (
                    <div key={plan.name} className="border rounded-xl p-4">
                      <h3 className="font-bold">{plan.name}</h3>
                      <p className="text-2xl font-bold mt-2">{plan.price}$<span className="text-sm font-normal text-gray-500">/mois</span></p>
                      <ul className="mt-4 space-y-2">
                        {plan.features.map(f => (
                          <li key={f} className="flex items-center gap-2 text-sm">
                            <Check size={14} className="text-green-500" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <button className="w-full mt-4 px-4 py-2 border rounded-lg hover:bg-gray-50">
                        Sélectionner
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Intégrations */}
          {tab === 'integrations' && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-6">Intégrations</h2>
              
              <div className="space-y-4">
                {[
                  { name: 'Autodesk Construction Cloud', connected: false },
                  { name: 'Zoho CRM', connected: true },
                  { name: 'QuickBooks', connected: false },
                  { name: 'Microsoft 365', connected: false },
                  { name: 'Google Workspace', connected: true },
                ].map(integration => (
                  <div key={integration.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <LinkIcon size={20} className="text-gray-400" />
                      </div>
                      <span className="font-medium">{integration.name}</span>
                    </div>
                    {integration.connected ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1">
                        <Check size={14} />
                        Connecté
                      </span>
                    ) : (
                      <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">
                        Connecter
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notifications */}
          {tab === 'notifications' && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-6">Préférences de notifications</h2>
              
              <div className="space-y-4">
                {[
                  { label: 'Nouveaux appels d\'offres SEAO', enabled: true },
                  { label: 'Rappels de soumissions', enabled: true },
                  { label: 'Mises à jour de projets', enabled: true },
                  { label: 'Notifications SST', enabled: false },
                  { label: 'Rapports hebdomadaires', enabled: true },
                ].map((notif, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3 border-b last:border-0">
                    <span>{notif.label}</span>
                    <button className={`w-12 h-6 rounded-full transition ${
                      notif.enabled ? 'bg-teal-600' : 'bg-gray-200'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition transform ${
                        notif.enabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
