import React, { useState } from 'react';
import { 
  Globe, Search, Filter, Download, RefreshCw, Star, StarOff,
  Calendar, DollarSign, MapPin, Building2, Clock, Eye, FileText,
  ExternalLink, Bell, CheckCircle, AlertTriangle, Tag, Bookmark
} from 'lucide-react';

interface AppelOffre {
  id: string;
  numeroSeao: string;
  titre: string;
  organisme: string;
  region: string;
  categorie: string;
  budget: string;
  datePublication: string;
  dateFermeture: string;
  joursRestants: number;
  favori: boolean;
  statut: 'open' | 'closing_soon' | 'closed';
  documents: number;
}

const SEAOModule: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedCategorie, setSelectedCategorie] = useState('all');
  const [showFavorisOnly, setShowFavorisOnly] = useState(false);
  const [selectedAppel, setSelectedAppel] = useState<string | null>(null);

  const regions = [
    'Montréal', 'Québec', 'Laval', 'Montérégie', 'Laurentides', 
    'Lanaudière', 'Estrie', 'Mauricie', 'Saguenay-Lac-Saint-Jean',
    'Outaouais', 'Abitibi-Témiscamingue', 'Côte-Nord', 'Bas-Saint-Laurent',
    'Gaspésie-Îles-de-la-Madeleine', 'Chaudière-Appalaches', 'Centre-du-Québec'
  ];

  const categories = [
    'Construction de bâtiments', 'Génie civil', 'Travaux de rénovation',
    'Services professionnels', 'Entretien et réparation', 'Électricité',
    'Plomberie et chauffage', 'Toiture', 'Aménagement paysager'
  ];

  const [appelsOffres, setAppelsOffres] = useState<AppelOffre[]>([
    { id: '1', numeroSeao: 'SEAO-2026-QC-45678', titre: 'Construction d\'un nouveau centre communautaire - Ville de Laval', organisme: 'Ville de Laval', region: 'Laval', categorie: 'Construction de bâtiments', budget: '8M$ - 12M$', datePublication: '2026-01-05', dateFermeture: '2026-02-15', joursRestants: 34, favori: true, statut: 'open', documents: 12 },
    { id: '2', numeroSeao: 'SEAO-2026-MTL-45692', titre: 'Rénovation de l\'école primaire Saint-Louis', organisme: 'Commission scolaire de Montréal', region: 'Montréal', categorie: 'Travaux de rénovation', budget: '2M$ - 3M$', datePublication: '2026-01-08', dateFermeture: '2026-01-20', joursRestants: 8, favori: true, statut: 'closing_soon', documents: 8 },
    { id: '3', numeroSeao: 'SEAO-2026-QC-45701', titre: 'Agrandissement du CHSLD Champlain', organisme: 'CISSS de la Montérégie', region: 'Montérégie', categorie: 'Construction de bâtiments', budget: '15M$ - 20M$', datePublication: '2026-01-10', dateFermeture: '2026-03-01', joursRestants: 48, favori: false, statut: 'open', documents: 18 },
    { id: '4', numeroSeao: 'SEAO-2026-SH-45689', titre: 'Réfection du système électrique - Arena municipal', organisme: 'Ville de Sherbrooke', region: 'Estrie', categorie: 'Électricité', budget: '500K$ - 800K$', datePublication: '2026-01-03', dateFermeture: '2026-01-25', joursRestants: 13, favori: false, statut: 'open', documents: 5 },
    { id: '5', numeroSeao: 'SEAO-2026-QC-45655', titre: 'Construction caserne pompiers secteur nord', organisme: 'Ville de Québec', region: 'Québec', categorie: 'Construction de bâtiments', budget: '5M$ - 7M$', datePublication: '2025-12-15', dateFermeture: '2026-01-12', joursRestants: 0, favori: false, statut: 'closed', documents: 14 },
  ]);

  const toggleFavori = (id: string) => {
    setAppelsOffres(appels => 
      appels.map(a => a.id === id ? { ...a, favori: !a.favori } : a)
    );
  };

  const getStatutBadge = (statut: string, jours: number) => {
    if (statut === 'closed') {
      return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">Fermé</span>;
    }
    if (jours <= 7) {
      return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">Ferme dans {jours}j</span>;
    }
    if (jours <= 14) {
      return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">{jours} jours</span>;
    }
    return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">{jours} jours</span>;
  };

  const filteredAppels = appelsOffres.filter(appel => {
    const matchSearch = appel.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       appel.numeroSeao.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       appel.organisme.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRegion = selectedRegion === 'all' || appel.region === selectedRegion;
    const matchCategorie = selectedCategorie === 'all' || appel.categorie === selectedCategorie;
    const matchFavori = !showFavorisOnly || appel.favori;
    return matchSearch && matchRegion && matchCategorie && matchFavori;
  });

  const stats = {
    total: appelsOffres.filter(a => a.statut !== 'closed').length,
    favoris: appelsOffres.filter(a => a.favori).length,
    fermentBientot: appelsOffres.filter(a => a.joursRestants <= 7 && a.statut !== 'closed').length,
    nouveaux: appelsOffres.filter(a => {
      const pubDate = new Date(a.datePublication);
      const now = new Date();
      return (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24) <= 7;
    }).length,
  };

  const currentAppel = appelsOffres.find(a => a.id === selectedAppel);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="text-blue-600" />
            SEAO - Appels d'offres publics
          </h1>
          <p className="text-gray-600">Système électronique d'appel d'offres du Québec</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <Bell size={18} />
            Alertes
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <RefreshCw size={18} />
            Synchroniser SEAO
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="text-blue-600" size={24} />
          <div>
            <p className="font-medium text-blue-900">Connecté au système SEAO</p>
            <p className="text-sm text-blue-700">Dernière synchronisation: Il y a 15 minutes</p>
          </div>
        </div>
        <a 
          href="https://www.seao.ca" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-blue-600 hover:underline"
        >
          Ouvrir SEAO <ExternalLink size={16} />
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Appels ouverts</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Mes favoris</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.favoris}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Ferment bientôt</p>
          <p className="text-2xl font-bold text-red-600">{stats.fermentBientot}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Nouveaux (7j)</p>
          <p className="text-2xl font-bold text-green-600">{stats.nouveaux}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Liste des appels */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm border">
          {/* Filters */}
          <div className="p-4 border-b">
            <div className="flex gap-4 mb-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher par titre, numéro SEAO, organisme..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button 
                onClick={() => setShowFavorisOnly(!showFavorisOnly)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg ${showFavorisOnly ? 'bg-yellow-50 border-yellow-300' : ''}`}
              >
                <Star size={18} className={showFavorisOnly ? 'text-yellow-500 fill-yellow-500' : ''} />
                Favoris
              </button>
            </div>
            <div className="flex gap-4">
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-4 py-2 border rounded-lg text-sm"
              >
                <option value="all">Toutes les régions</option>
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <select
                value={selectedCategorie}
                onChange={(e) => setSelectedCategorie(e.target.value)}
                className="px-4 py-2 border rounded-lg text-sm"
              >
                <option value="all">Toutes les catégories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Liste */}
          <div className="divide-y max-h-[600px] overflow-auto">
            {filteredAppels.map((appel) => (
              <div 
                key={appel.id}
                onClick={() => setSelectedAppel(appel.id)}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedAppel === appel.id ? 'bg-blue-50' : ''} ${appel.statut === 'closed' ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-gray-500">{appel.numeroSeao}</span>
                      {getStatutBadge(appel.statut, appel.joursRestants)}
                    </div>
                    <h4 className="font-medium text-sm">{appel.titre}</h4>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleFavori(appel.id); }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {appel.favori ? (
                      <Star size={18} className="text-yellow-500 fill-yellow-500" />
                    ) : (
                      <StarOff size={18} className="text-gray-300" />
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Building2 size={12} />
                    {appel.organisme}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {appel.region}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign size={12} />
                    {appel.budget}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Détail */}
        <div className="space-y-4">
          {currentAppel ? (
            <>
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-start justify-between mb-4">
                  <span className="font-mono text-sm text-blue-600">{currentAppel.numeroSeao}</span>
                  <button 
                    onClick={() => toggleFavori(currentAppel.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    {currentAppel.favori ? (
                      <Star size={20} className="text-yellow-500 fill-yellow-500" />
                    ) : (
                      <StarOff size={20} className="text-gray-300" />
                    )}
                  </button>
                </div>
                
                <h3 className="font-semibold mb-4">{currentAppel.titre}</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Building2 size={16} className="text-gray-400" />
                    <div>
                      <p className="text-gray-500">Organisme</p>
                      <p className="font-medium">{currentAppel.organisme}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-gray-400" />
                    <div>
                      <p className="text-gray-500">Région</p>
                      <p className="font-medium">{currentAppel.region}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Tag size={16} className="text-gray-400" />
                    <div>
                      <p className="text-gray-500">Catégorie</p>
                      <p className="font-medium">{currentAppel.categorie}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign size={16} className="text-gray-400" />
                    <div>
                      <p className="text-gray-500">Budget estimé</p>
                      <p className="font-medium">{currentAppel.budget}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-gray-400" />
                    <div>
                      <p className="text-gray-500">Date de fermeture</p>
                      <p className="font-medium">{currentAppel.dateFermeture}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <FileText size={16} />
                    Documents ({currentAppel.documents})
                  </h4>
                  <div className="space-y-2">
                    {['Avis d\'appel d\'offres.pdf', 'Devis techniques.pdf', 'Plans architecturaux.zip', 'Addenda #1.pdf'].slice(0, 4).map((doc, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <span>{doc}</span>
                        <Download size={14} className="text-gray-400 cursor-pointer hover:text-blue-600" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                    <ExternalLink size={18} />
                    Voir sur SEAO
                  </button>
                  <button className="w-full py-2 border rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2">
                    <FileText size={18} />
                    Créer soumission
                  </button>
                </div>
              </div>

              {/* Rappels */}
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Bell size={16} className="text-orange-500" />
                  Rappels
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span>7 jours avant fermeture</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span>3 jours avant fermeture</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Nouvel addenda publié</span>
                  </label>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-6 text-center text-gray-500">
              <Globe size={48} className="mx-auto text-gray-300 mb-3" />
              <p>Sélectionnez un appel d'offres</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SEAOModule;
