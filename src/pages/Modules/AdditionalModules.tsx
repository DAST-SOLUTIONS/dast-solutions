import React, { useState } from 'react';
import { 
  Smartphone, Wifi, WifiOff, Download, Bell, Battery, Signal, RefreshCw, 
  Check, Menu, Home, FolderOpen, FileText, Settings,
  AlertTriangle, CheckCircle, Clock, Ruler, Square, Circle,
  Zap, Link2, Brain, Upload, Sparkles, Target, Image as ImageIcon, Calculator
} from 'lucide-react';

// ============================================================
// #11 - PWA Mobile Module
// ============================================================
export const PWAModule: React.FC = () => {
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

// ============================================================
// #12 - Notifications Module
// ============================================================
interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export const NotificationsModule: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  
  const [notifications] = useState<Notification[]>([
    { id: '1', type: 'warning', title: 'Retard de livraison', message: 'La livraison de béton pour Tour Deloitte est retardée de 2h', time: 'Il y a 5 min', read: false },
    { id: '2', type: 'success', title: 'Rapport approuvé', message: 'Le rapport RJ-2026-010 a été approuvé par Jean Tremblay', time: 'Il y a 15 min', read: false },
    { id: '3', type: 'info', title: 'Nouvelle tâche assignée', message: 'Vous avez été assigné à "Installation coffrage niveau 4"', time: 'Il y a 1h', read: true },
    { id: '4', type: 'error', title: 'Facture en retard', message: 'La facture FACT-2025-089 est en retard de paiement depuis 14 jours', time: 'Il y a 2h', read: true },
    { id: '5', type: 'info', title: 'Météo défavorable', message: 'Alerte neige prévue demain - possibles ajustements de planning', time: 'Il y a 3h', read: true },
  ]);

  const getIcon = (type: string) => {
    switch(type) {
      case 'warning': return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'success': return <CheckCircle className="text-green-500" size={20} />;
      case 'error': return <AlertTriangle className="text-red-500" size={20} />;
      default: return <Bell className="text-blue-500" size={20} />;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="text-blue-600" />
            Notifications
          </h1>
          <p className="text-gray-600">Alertes et notifications en temps réel</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50">
          <Settings size={18} />
          Préférences
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Non lues</p>
          <p className="text-2xl font-bold text-blue-600">{notifications.filter(n => !n.read).length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Aujourd'hui</p>
          <p className="text-2xl font-bold">8</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Alertes</p>
          <p className="text-2xl font-bold text-orange-600">2</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Cette semaine</p>
          <p className="text-2xl font-bold">34</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex gap-2">
            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}>Toutes</button>
            <button onClick={() => setFilter('unread')} className={`px-4 py-2 rounded-lg ${filter === 'unread' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}>Non lues</button>
          </div>
          <button className="text-sm text-blue-600 hover:underline">Tout marquer comme lu</button>
        </div>
        <div className="divide-y">
          {notifications.filter(n => filter === 'all' || !n.read).map((notif) => (
            <div key={notif.id} className={`p-4 flex gap-4 hover:bg-gray-50 ${!notif.read ? 'bg-blue-50/50' : ''}`}>
              <div className="flex-shrink-0 mt-1">{getIcon(notif.type)}</div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <h4 className="font-medium">{notif.title}</h4>
                  <span className="text-sm text-gray-500">{notif.time}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
              </div>
              {!notif.read && <div className="w-2 h-2 rounded-full bg-blue-600 mt-2" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// #15 - Takeoff to Quote Sync Module
// ============================================================
export const TakeoffSyncModule: React.FC = () => {
  const [measurements] = useState([
    { id: '1', type: 'area', name: 'Plancher béton N1', value: 450, unit: 'm²', layer: 'Béton', linked: true },
    { id: '2', type: 'length', name: 'Mur extérieur', value: 120, unit: 'm', layer: 'Maçonnerie', linked: true },
    { id: '3', type: 'count', name: 'Fenêtres standard', value: 24, unit: 'unités', layer: 'Fenestration', linked: false },
    { id: '4', type: 'area', name: 'Toiture plate', value: 380, unit: 'm²', layer: 'Toiture', linked: true },
    { id: '5', type: 'length', name: 'Conduits CVAC', value: 85, unit: 'm', layer: 'Mécanique', linked: false },
  ]);

  const [quoteItems] = useState([
    { measurement: 'Plancher béton N1', qty: 450, unit: 'm²', unitCost: 85, labor: 25, total: 49500 },
    { measurement: 'Mur extérieur', qty: 120, unit: 'm', unitCost: 220, labor: 45, total: 31800 },
    { measurement: 'Toiture plate', qty: 380, unit: 'm²', unitCost: 125, labor: 35, total: 60800 },
  ]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Link2 className="text-blue-600" />
            Takeoff → Soumission
          </h1>
          <p className="text-gray-600">Conversion automatique des mesures en soumission</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Zap size={18} />
          Générer soumission
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b flex items-center gap-2">
            <Ruler className="text-blue-600" />
            <h3 className="font-semibold">Mesures du Takeoff</h3>
          </div>
          <div className="divide-y">
            {measurements.map((m) => (
              <div key={m.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  {m.type === 'area' && <Square size={18} className="text-blue-500" />}
                  {m.type === 'length' && <Ruler size={18} className="text-green-500" />}
                  {m.type === 'count' && <Circle size={18} className="text-purple-500" />}
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <p className="text-sm text-gray-500">{m.layer}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono font-medium">{m.value} {m.unit}</span>
                  {m.linked ? (
                    <span className="text-green-600 text-sm flex items-center gap-1"><Check size={14} /> Lié</span>
                  ) : (
                    <button className="text-blue-600 text-sm hover:underline">Lier</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b flex items-center gap-2">
            <Calculator className="text-green-600" />
            <h3 className="font-semibold">Soumission générée</h3>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-gray-500">Item</th>
                <th className="text-right p-3 text-sm font-medium text-gray-500">Qté</th>
                <th className="text-right p-3 text-sm font-medium text-gray-500">Mat.</th>
                <th className="text-right p-3 text-sm font-medium text-gray-500">M.O.</th>
                <th className="text-right p-3 text-sm font-medium text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody>
              {quoteItems.map((item, i) => (
                <tr key={i} className="border-t">
                  <td className="p-3 text-sm">{item.measurement}</td>
                  <td className="p-3 text-right text-sm">{item.qty} {item.unit}</td>
                  <td className="p-3 text-right text-sm">{item.unitCost}$</td>
                  <td className="p-3 text-right text-sm">{item.labor}$</td>
                  <td className="p-3 text-right font-medium">{item.total.toLocaleString()}$</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={4} className="p-3 text-right font-medium">Sous-total</td>
                <td className="p-3 text-right font-bold">{quoteItems.reduce((s, i) => s + i.total, 0).toLocaleString()}$</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-semibold mb-4">Règles de conversion automatique</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { layer: 'Béton', material: '85$/m²', labor: '25$/m²', overhead: '10%' },
            { layer: 'Maçonnerie', material: '220$/m', labor: '45$/m', overhead: '12%' },
            { layer: 'Toiture', material: '125$/m²', labor: '35$/m²', overhead: '10%' },
          ].map((rule, i) => (
            <div key={i} className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">{rule.layer}</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Matériel: {rule.material}</p>
                <p>Main d'œuvre: {rule.labor}</p>
                <p>Frais généraux: {rule.overhead}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// #19 - AI Recognition Module
// ============================================================
export const AIRecognitionModule: React.FC = () => {
  const [results] = useState([
    { type: 'Porte', count: 12, confidence: 94, status: 'validated' },
    { type: 'Fenêtre', count: 24, confidence: 91, status: 'validated' },
    { type: 'Prise électrique', count: 48, confidence: 87, status: 'pending' },
    { type: 'Luminaire', count: 36, confidence: 82, status: 'pending' },
    { type: 'Évier', count: 4, confidence: 78, status: 'review' },
  ]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="text-purple-600" />
            Reconnaissance IA
          </h1>
          <p className="text-gray-600">Extraction automatique des quantités par intelligence artificielle</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Plans analysés</p>
          <p className="text-2xl font-bold">47</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Items détectés</p>
          <p className="text-2xl font-bold text-purple-600">1,284</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Précision moyenne</p>
          <p className="text-2xl font-bold text-green-600">89%</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Temps économisé</p>
          <p className="text-2xl font-bold">24h</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Upload className="text-blue-600" size={20} />
            Analyser un plan
          </h3>
          <div className="border-2 border-dashed rounded-xl p-8 text-center hover:border-blue-400 cursor-pointer transition-colors">
            <ImageIcon size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600">Glissez un plan PDF ici</p>
            <p className="text-sm text-gray-400 mt-1">ou cliquez pour sélectionner</p>
          </div>
          <div className="mt-4 space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm">Détecter les portes et fenêtres</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm">Détecter les éléments électriques</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm">Détecter la plomberie</span>
            </label>
          </div>
          <button className="mt-4 w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2">
            <Sparkles size={18} />
            Lancer l'analyse
          </button>
        </div>

        <div className="col-span-2 bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Target className="text-green-600" size={20} />
              Résultats de détection
            </h3>
            <span className="text-sm text-gray-500">Plan: Niveau-1-Architectural.pdf</span>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-gray-500">Élément</th>
                <th className="text-right p-3 text-sm font-medium text-gray-500">Quantité</th>
                <th className="text-right p-3 text-sm font-medium text-gray-500">Confiance</th>
                <th className="text-center p-3 text-sm font-medium text-gray-500">Statut</th>
                <th className="text-center p-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{item.type}</td>
                  <td className="p-3 text-right font-mono">{item.count}</td>
                  <td className="p-3 text-right">
                    <span className={`font-medium ${item.confidence >= 90 ? 'text-green-600' : item.confidence >= 80 ? 'text-yellow-600' : 'text-orange-600'}`}>
                      {item.confidence}%
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {item.status === 'validated' && <span className="inline-flex items-center gap-1 text-green-600 text-sm"><CheckCircle size={14} /> Validé</span>}
                    {item.status === 'pending' && <span className="inline-flex items-center gap-1 text-blue-600 text-sm"><Clock size={14} /> En attente</span>}
                    {item.status === 'review' && <span className="inline-flex items-center gap-1 text-orange-600 text-sm"><AlertTriangle size={14} /> À revoir</span>}
                  </td>
                  <td className="p-3 text-center">
                    <button className="text-blue-600 hover:underline text-sm">Voir sur plan</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 border-t flex justify-between">
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">Tout valider</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Exporter vers Takeoff</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default { PWAModule, NotificationsModule, TakeoffSyncModule, AIRecognitionModule };
