import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '@/components/PageTitle'
import { Save, LogOut, Moon, Sun, CreditCard } from 'lucide-react'

export function Settings() {
  const { userProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const [darkMode, setDarkMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    // Simuler une sauvegarde
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }, 1000)
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

  return (
    <div className="animate-fade-in">
      <PageTitle title="Paramètres" subtitle="Gérez votre compte et préférences" />

      {saved && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          Paramètres sauvegardés avec succès!
        </div>
      )}

      {/* PROFIL */}
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

        <form onSubmit={handleSave} className="space-y-4">
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
            <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être changé</p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary flex items-center gap-2"
          >
            <Save size={18} />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </form>
      </div>

      {/* PRÉFÉRENCES */}
      <div className="bg-white p-8 rounded-lg shadow mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Préférences</h2>
        
        <div className="space-y-6">
          {/* Dark Mode */}
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

          {/* Notifications */}
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

      {/* ABONNEMENT */}
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