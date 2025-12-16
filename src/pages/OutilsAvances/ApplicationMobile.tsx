/**
 * DAST Solutions - Application Mobile PWA
 * Interface pour installation et configuration de l'app mobile
 */
import { useState } from 'react'
import { PageTitle } from '@/components/PageTitle'
import { Smartphone, Download, QrCode, Check, Bell, Camera, MapPin, Wifi, WifiOff, Battery, Shield, Zap, RefreshCw, Settings, ChevronRight, Monitor, Tablet, Watch, Cloud, Lock, Star, ExternalLink, Play, Apple, Chrome } from 'lucide-react'

interface Feature {
  icon: React.ElementType; title: string; description: string; available: boolean
}

const FEATURES: Feature[] = [
  { icon: Camera, title: 'Capture photos chantier', description: 'Prenez des photos géolocalisées directement sur le terrain', available: true },
  { icon: MapPin, title: 'Géolocalisation', description: 'Localisez vos projets et suivez vos équipes en temps réel', available: true },
  { icon: Bell, title: 'Notifications push', description: 'Recevez des alertes importantes instantanément', available: true },
  { icon: WifiOff, title: 'Mode hors-ligne', description: 'Continuez à travailler sans connexion internet', available: true },
  { icon: Zap, title: 'Synchronisation rapide', description: 'Synchronisez vos données automatiquement', available: true },
  { icon: Shield, title: 'Sécurité renforcée', description: 'Vos données sont chiffrées et sécurisées', available: true },
  { icon: RefreshCw, title: 'Mises à jour auto', description: 'Application toujours à jour sans action requise', available: true },
  { icon: Battery, title: 'Optimisé batterie', description: 'Consommation minimale de batterie', available: true },
]

const PLATFORMS = [
  { id: 'android', name: 'Android', icon: Play, color: 'bg-green-500', status: 'Disponible', url: '#' },
  { id: 'ios', name: 'iOS', icon: Apple, color: 'bg-gray-800', status: 'Bientôt', url: '#' },
  { id: 'web', name: 'Web App', icon: Chrome, color: 'bg-blue-500', status: 'Disponible', url: '#' },
]

export default function ApplicationMobile() {
  const [showQR, setShowQR] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<any>(null)

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      if (outcome === 'accepted') console.log('App installed')
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <PageTitle title="Application Mobile DAST" />
        <p className="text-gray-500 mt-2 text-lg">Gérez vos projets de construction où que vous soyez</p>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-3xl p-8 md:p-12 text-white mb-12">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-4">DAST Mobile</h2>
            <p className="text-teal-100 text-lg mb-6">Accédez à tous vos projets, soumissions et documents depuis votre téléphone. Travaillez efficacement sur le terrain avec ou sans connexion.</p>
            <div className="flex flex-wrap gap-4">
              <button onClick={handleInstall} className="flex items-center gap-2 px-6 py-3 bg-white text-teal-700 rounded-xl font-semibold hover:bg-teal-50 transition">
                <Download size={20} />Installer l'app
              </button>
              <button onClick={() => setShowQR(true)} className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-500 border border-teal-400 transition">
                <QrCode size={20} />Code QR
              </button>
            </div>
          </div>
          <div className="flex items-end gap-4">
            <div className="bg-gray-900 rounded-3xl p-2 shadow-2xl">
              <div className="bg-white rounded-2xl w-48 h-80 flex items-center justify-center">
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">D</span>
                  </div>
                  <p className="font-semibold text-gray-900">DAST Solutions</p>
                  <p className="text-xs text-gray-500 mt-1">Construction Management</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plateformes */}
      <div className="mb-12">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Disponible sur</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {PLATFORMS.map(p => (
            <a key={p.id} href={p.url} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition group">
              <div className={`p-3 ${p.color} rounded-xl text-white`}><p.icon size={24} /></div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{p.name}</div>
                <div className={`text-sm ${p.status === 'Disponible' ? 'text-green-600' : 'text-amber-600'}`}>{p.status}</div>
              </div>
              <ChevronRight size={20} className="text-gray-400 group-hover:text-teal-600 transition" />
            </a>
          ))}
        </div>
      </div>

      {/* Fonctionnalités */}
      <div className="mb-12">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Fonctionnalités</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-teal-50 rounded-lg"><f.icon size={20} className="text-teal-600" /></div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{f.title}</h4>
                  <p className="text-sm text-gray-500">{f.description}</p>
                </div>
              </div>
              {f.available && <div className="mt-3 flex items-center gap-1 text-xs text-green-600"><Check size={14} />Disponible</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Instructions d'installation */}
      <div className="bg-gray-50 rounded-2xl p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Comment installer ?</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
            <h4 className="font-semibold mb-2">Ouvrez l'app</h4>
            <p className="text-sm text-gray-500">Accédez à app.dast.ca depuis Chrome sur mobile</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
            <h4 className="font-semibold mb-2">Menu du navigateur</h4>
            <p className="text-sm text-gray-500">Tapez sur les 3 points en haut à droite</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
            <h4 className="font-semibold mb-2">Ajouter à l'écran</h4>
            <p className="text-sm text-gray-500">Sélectionnez "Installer l'application"</p>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-2xl p-8 text-center max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Scannez le QR Code</h3>
            <div className="bg-gray-100 rounded-xl p-8 mb-4">
              <div className="w-48 h-48 bg-white mx-auto rounded-lg flex items-center justify-center border-4 border-gray-200">
                <QrCode size={120} className="text-gray-800" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4">Scannez avec l'appareil photo de votre téléphone pour installer l'application</p>
            <button onClick={() => setShowQR(false)} className="px-6 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Fermer</button>
          </div>
        </div>
      )}
    </div>
  )
}
