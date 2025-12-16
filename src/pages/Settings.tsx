/**
 * DAST Solutions - Page Paramètres
 * Avec configuration entreprise pour export PDF
 */
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '@/components/PageTitle'
import { supabase } from '@/lib/supabase'
import { 
  Save, LogOut, Moon, Sun, CreditCard, Building, 
  Upload, Trash2, Check, Loader2, FileText, Phone,
  Mail, Globe, Award, Hash
} from 'lucide-react'

interface EntrepriseSettings {
  nom: string
  adresse: string
  ville: string
  province: string
  codePostal: string
  telephone: string
  email: string
  site: string
  rbqLicence: string
  neq: string
  logo: string | null
}

const DEFAULT_ENTREPRISE: EntrepriseSettings = {
  nom: '',
  adresse: '',
  ville: '',
  province: 'QC',
  codePostal: '',
  telephone: '',
  email: '',
  site: '',
  rbqLicence: '',
  neq: '',
  logo: null
}

export function Settings() {
  const { userProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const [darkMode, setDarkMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'profil' | 'entreprise' | 'preferences' | 'abonnement'>('profil')
  
  // Paramètres entreprise
  const [entreprise, setEntreprise] = useState<EntrepriseSettings>(DEFAULT_ENTREPRISE)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [defaultConditions, setDefaultConditions] = useState('')
  const [defaultExclusions, setDefaultExclusions] = useState('')

  // Charger les paramètres
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (data) {
          if (data.entreprise_settings) {
            setEntreprise({ ...DEFAULT_ENTREPRISE, ...data.entreprise_settings })
          }
          if (data.default_conditions) {
            setDefaultConditions(data.default_conditions)
          }
          if (data.default_exclusions) {
            setDefaultExclusions(data.default_exclusions)
          }
        }
      } catch (err) {
        console.error('Erreur chargement paramètres:', err)
      } finally {
        setLoadingSettings(false)
      }
    }

    loadSettings()
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const handleSaveEntreprise = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          entreprise_settings: entreprise,
          default_conditions: defaultConditions,
          default_exclusions: defaultExclusions,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (error) throw error

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Erreur sauvegarde:', err)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  // Upload logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 500000) {
      alert('Le logo doit faire moins de 500 KB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setEntreprise({ ...entreprise, logo: reader.result as string })
    }
    reader.readAsDataURL(file)
  }

  const plans = [
    {
      name: 'Gratuit',
      price: 0,
      current: true,
      features: ['5 takeoffs/mois', 'Support par email', 'Données stockées'],
    },
    {
      name: 'Pro',
      price: 29,
      features: ['Takeoffs illimités', 'Jusqu\'à 10 projets', 'Export PDF', 'Support prioritaire', 'API accès'],
    },
    {
      name: 'Entreprise',
      price: 99,
      features: ['Tout du Pro', 'Projets illimités', 'Utilisateurs illimités', 'Support 24/7', 'Training inclus', 'SLA garanti'],
    },
  ]

  const tabs = [
    { id: 'profil', label: 'Profil', icon: null },
    { id: 'entreprise', label: 'Entreprise', icon: Building },
    { id: 'preferences', label: 'Préférences', icon: null },
    { id: 'abonnement', label: 'Abonnement', icon: CreditCard },
  ]

  return (
    <div className="animate-fade-in">
      <PageTitle title="Paramètres" subtitle="Gérez votre compte et préférences" />

      {saved && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
          <Check size={20} />
          Paramètres sauvegardés avec succès!
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 font-medium transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon && <tab.icon size={18} />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* PROFIL */}
      {activeTab === 'profil' && (
        <div className="bg-white p-8 rounded-lg shadow mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Profil</h2>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-teal-500 to-orange-400 flex items-center justify-center text-white text-2xl font-bold">
              {userProfile?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">{userProfile?.fullName}</p>
              <p className="text-gray-600">{userProfile?.email}</p>
            </div>
          </div>

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
              <input
                type="text"
                defaultValue={userProfile?.fullName || ''}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                defaultValue={userProfile?.email || ''}
                disabled
                className="input-field opacity-50 cursor-not-allowed"
              />
            </div>

            <button type="submit" className="btn btn-primary flex items-center gap-2">
              <Save size={18} />
              Sauvegarder
            </button>
          </form>
        </div>
      )}

      {/* ENTREPRISE - NOUVEAU */}
      {activeTab === 'entreprise' && (
        <div className="bg-white p-8 rounded-lg shadow mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Building size={28} className="text-teal-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Informations Entreprise</h2>
              <p className="text-gray-500">Ces informations apparaîtront sur vos soumissions PDF</p>
            </div>
          </div>

          {loadingSettings ? (
            <div className="flex justify-center py-12">
              <Loader2 size={32} className="animate-spin text-teal-600" />
            </div>
          ) : (
            <form onSubmit={handleSaveEntreprise} className="space-y-6">
              {/* Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                <div className="flex items-center gap-4">
                  {entreprise.logo ? (
                    <div className="relative">
                      <img 
                        src={entreprise.logo} 
                        alt="Logo" 
                        className="w-24 h-24 object-contain border rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setEntreprise({ ...entreprise, logo: null })}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-teal-400">
                      <Upload size={24} className="text-gray-400" />
                      <span className="text-xs text-gray-500 mt-1">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                  <p className="text-sm text-gray-500">PNG ou JPG, max 500 KB</p>
                </div>
              </div>

              {/* Nom entreprise */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building size={16} className="inline mr-2" />
                  Nom de l'entreprise
                </label>
                <input
                  type="text"
                  value={entreprise.nom}
                  onChange={(e) => setEntreprise({ ...entreprise, nom: e.target.value })}
                  placeholder="Construction ABC Inc."
                  className="input-field"
                />
              </div>

              {/* Adresse */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                  <input
                    type="text"
                    value={entreprise.adresse}
                    onChange={(e) => setEntreprise({ ...entreprise, adresse: e.target.value })}
                    placeholder="123 Rue Principale"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                  <input
                    type="text"
                    value={entreprise.ville}
                    onChange={(e) => setEntreprise({ ...entreprise, ville: e.target.value })}
                    placeholder="Montréal"
                    className="input-field"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Province</label>
                    <select
                      value={entreprise.province}
                      onChange={(e) => setEntreprise({ ...entreprise, province: e.target.value })}
                      className="input-field"
                    >
                      <option value="QC">Québec</option>
                      <option value="ON">Ontario</option>
                      <option value="NB">Nouveau-Brunswick</option>
                      <option value="NS">Nouvelle-Écosse</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Code postal</label>
                    <input
                      type="text"
                      value={entreprise.codePostal}
                      onChange={(e) => setEntreprise({ ...entreprise, codePostal: e.target.value.toUpperCase() })}
                      placeholder="H2X 1Y6"
                      maxLength={7}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone size={16} className="inline mr-2" />
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={entreprise.telephone}
                    onChange={(e) => setEntreprise({ ...entreprise, telephone: e.target.value })}
                    placeholder="(514) 555-1234"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail size={16} className="inline mr-2" />
                    Courriel
                  </label>
                  <input
                    type="email"
                    value={entreprise.email}
                    onChange={(e) => setEntreprise({ ...entreprise, email: e.target.value })}
                    placeholder="info@entreprise.ca"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe size={16} className="inline mr-2" />
                    Site web
                  </label>
                  <input
                    type="url"
                    value={entreprise.site}
                    onChange={(e) => setEntreprise({ ...entreprise, site: e.target.value })}
                    placeholder="www.entreprise.ca"
                    className="input-field"
                  />
                </div>
              </div>

              {/* RBQ & NEQ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Award size={16} className="inline mr-2" />
                    Licence RBQ
                  </label>
                  <input
                    type="text"
                    value={entreprise.rbqLicence}
                    onChange={(e) => setEntreprise({ ...entreprise, rbqLicence: e.target.value })}
                    placeholder="1234-5678-90"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Hash size={16} className="inline mr-2" />
                    NEQ
                  </label>
                  <input
                    type="text"
                    value={entreprise.neq}
                    onChange={(e) => setEntreprise({ ...entreprise, neq: e.target.value })}
                    placeholder="1234567890"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Conditions par défaut */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText size={16} className="inline mr-2" />
                  Conditions par défaut (soumissions)
                </label>
                <textarea
                  value={defaultConditions}
                  onChange={(e) => setDefaultConditions(e.target.value)}
                  rows={3}
                  placeholder="Les prix sont valides pour 30 jours..."
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exclusions par défaut (soumissions)
                </label>
                <textarea
                  value={defaultExclusions}
                  onChange={(e) => setDefaultExclusions(e.target.value)}
                  rows={3}
                  placeholder="Permis et frais municipaux..."
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary flex items-center gap-2"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* PRÉFÉRENCES */}
      {activeTab === 'preferences' && (
        <div className="bg-white p-8 rounded-lg shadow mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Préférences</h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                {darkMode ? <Moon size={24} /> : <Sun size={24} />}
                <div>
                  <p className="font-semibold text-gray-900">Mode sombre</p>
                  <p className="text-sm text-gray-600">Activer le thème sombre</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={() => setDarkMode(!darkMode)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div>
                <p className="font-semibold text-gray-900">Notifications par email</p>
                <p className="text-sm text-gray-600">Recevoir des mises à jour importantes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ABONNEMENT */}
      {activeTab === 'abonnement' && (
        <div className="bg-white p-8 rounded-lg shadow mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <CreditCard size={24} /> Abonnement
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-lg border-2 p-6 transition ${
                  plan.current
                    ? 'border-teal-600 bg-teal-50'
                    : 'border-gray-200 hover:border-teal-400'
                }`}
              >
                {plan.current && (
                  <div className="inline-block bg-teal-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                    Plan actuel
                  </div>
                )}

                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-4 text-3xl font-extrabold text-gray-900">
                  {plan.price === 0 ? 'Gratuit' : `${plan.price}$`}
                  {plan.price > 0 && <span className="text-sm font-medium text-gray-500">/mois</span>}
                </div>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-gray-700 text-sm">
                      <span className="text-teal-600 font-bold mt-1">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {!plan.current && (
                  <button className="btn btn-primary w-full mt-6">
                    Passer à {plan.name}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DANGER ZONE */}
      <div className="bg-red-50 border border-red-200 p-8 rounded-lg">
        <h2 className="text-2xl font-bold text-red-900 mb-6">Zone de danger</h2>

        <button
          onClick={handleSignOut}
          className="btn bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
    </div>
  )
}
export default Settings
