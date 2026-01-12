import React, { useState } from 'react';
import { 
  Smartphone, Wifi, WifiOff, Download, Battery, Signal, RefreshCw, 
  Check, Menu, Home, FolderOpen, FileText, Settings
} from 'lucide-react';

const PWAModule: React.FC = () => {
  const [isOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState(true);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Smartphone className="text-blue-600" />
            Application Mobile PWA
          </h1>
          <p className="text-gray-600">Version responsive et mode hors-ligne</p>
        </div>
      </div>

      {installPrompt && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Download className="text-blue-600" size={24} />
            <div>
              <p className="font-medium">Installer l'application</p>
              <p className="text-sm text-gray-600">Accédez rapidement depuis votre écran d'accueil</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setInstallPrompt(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Plus tard</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Installer</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold mb-4">Statut de l'application</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                {isOnline ? <Wifi className="text-green-500" /> : <WifiOff className="text-red-500" />}
                <div>
                  <p className="font-medium">{isOnline ? 'En ligne' : 'Hors ligne'}</p>
                  <p className="text-sm text-gray-500">Connexion réseau</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Battery className="text-green-500" />
                <div>
                  <p className="font-medium">85%</p>
                  <p className="text-sm text-gray-500">Batterie</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Signal className="text-blue-500" />
                <div>
                  <p className="font-medium">4G LTE</p>
                  <p className="text-sm text-gray-500">Réseau</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold mb-4">Données synchronisées</h3>
            <div className="space-y-3">
              {[
                { name: 'Projets', synced: 12, pending: 0 },
                { name: 'Rapports terrain', synced: 45, pending: 2 },
                { name: 'Photos', synced: 156, pending: 8 },
                { name: 'Feuilles de temps', synced: 23, pending: 1 },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span>{item.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-green-600 flex items-center gap-1"><Check size={14} /> {item.synced}</span>
                    {item.pending > 0 && <span className="text-orange-600 flex items-center gap-1"><RefreshCw size={14} /> {item.pending}</span>}
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full py-2 border rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2">
              <RefreshCw size={16} /> Synchroniser maintenant
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold mb-4 text-center">Aperçu Mobile</h3>
          <div className="border-4 border-gray-800 rounded-3xl p-2 bg-gray-800">
            <div className="bg-white rounded-2xl overflow-hidden h-96">
              <div className="bg-blue-600 text-white p-3 flex items-center gap-2">
                <Menu size={20} />
                <span className="font-medium">DAST Solutions</span>
              </div>
              <div className="p-3 space-y-2">
                {[
                  { icon: Home, label: 'Accueil' },
                  { icon: FolderOpen, label: 'Projets' },
                  { icon: FileText, label: 'Rapports' },
                  { icon: Settings, label: 'Paramètres' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <item.icon size={18} className="text-blue-600" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAModule;
