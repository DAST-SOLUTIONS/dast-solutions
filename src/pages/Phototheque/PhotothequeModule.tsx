import React, { useState } from 'react';
import { 
  Camera, Image, Calendar, FolderOpen, Upload, Download,
  Search, Filter, Grid, List, Plus, Eye, Trash2, Tag,
  MapPin, Clock, User, X, ChevronLeft, ChevronRight, ZoomIn
} from 'lucide-react';

interface Photo {
  id: string;
  url: string;
  titre: string;
  projet: string;
  date: string;
  zone: string;
  tags: string[];
  auteur: string;
  type: 'avant' | 'pendant' | 'apres' | 'defaut' | 'progression';
}

interface Album {
  id: string;
  nom: string;
  projet: string;
  photosCount: number;
  dateDebut: string;
  dateFin: string;
  cover: string;
}

const PhotothequeModule: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [activeTab, setActiveTab] = useState<'photos' | 'albums' | 'comparaison'>('photos');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filterProjet, setFilterProjet] = useState('all');

  const [photos] = useState<Photo[]>([
    { id: '1', url: '/api/placeholder/400/300', titre: 'Fondations - Coulée béton', projet: 'Tour Deloitte', date: '2026-01-12', zone: 'Secteur A', tags: ['fondations', 'béton'], auteur: 'Marc Tremblay', type: 'progression' },
    { id: '2', url: '/api/placeholder/400/300', titre: 'Structure acier niveau 3', projet: 'Tour Deloitte', date: '2026-01-10', zone: 'Niveau 3', tags: ['structure', 'acier'], auteur: 'Jean Gagnon', type: 'progression' },
    { id: '3', url: '/api/placeholder/400/300', titre: 'Défaut membrane toiture', projet: 'Centre Bell', date: '2026-01-08', zone: 'Toiture', tags: ['défaut', 'toiture'], auteur: 'Pierre Roy', type: 'defaut' },
    { id: '4', url: '/api/placeholder/400/300', titre: 'Avant travaux - Entrée', projet: 'École Primaire', date: '2025-09-01', zone: 'Entrée principale', tags: ['avant', 'façade'], auteur: 'Luc Martin', type: 'avant' },
    { id: '5', url: '/api/placeholder/400/300', titre: 'Après travaux - Entrée', projet: 'École Primaire', date: '2026-01-05', zone: 'Entrée principale', tags: ['après', 'façade'], auteur: 'Luc Martin', type: 'apres' },
    { id: '6', url: '/api/placeholder/400/300', titre: 'Installation CVAC', projet: 'Tour Deloitte', date: '2026-01-09', zone: 'Mécanique', tags: ['mécanique', 'cvac'], auteur: 'Marc Tremblay', type: 'progression' },
    { id: '7', url: '/api/placeholder/400/300', titre: 'Coffrage colonnes', projet: 'Résidence Soleil', date: '2026-01-11', zone: 'Niveau 1', tags: ['coffrage', 'béton'], auteur: 'Jean Gagnon', type: 'progression' },
    { id: '8', url: '/api/placeholder/400/300', titre: 'Vue aérienne chantier', projet: 'Tour Deloitte', date: '2026-01-13', zone: 'Global', tags: ['drone', 'vue aérienne'], auteur: 'Drone Pro', type: 'progression' },
  ]);

  const [albums] = useState<Album[]>([
    { id: '1', nom: 'Fondations Tour Deloitte', projet: 'Tour Deloitte', photosCount: 45, dateDebut: '2025-06-01', dateFin: '2025-09-15', cover: '/api/placeholder/400/300' },
    { id: '2', nom: 'Structure acier', projet: 'Tour Deloitte', photosCount: 78, dateDebut: '2025-09-16', dateFin: '2026-01-15', cover: '/api/placeholder/400/300' },
    { id: '3', nom: 'Rénovation Centre Bell', projet: 'Centre Bell', photosCount: 124, dateDebut: '2025-03-01', dateFin: '2026-01-10', cover: '/api/placeholder/400/300' },
    { id: '4', nom: 'Avant/Après École', projet: 'École Primaire', photosCount: 32, dateDebut: '2025-09-01', dateFin: '2026-01-05', cover: '/api/placeholder/400/300' },
  ]);

  const getTypeBadge = (type: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      avant: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Avant' },
      pendant: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'En cours' },
      apres: { bg: 'bg-green-100', text: 'text-green-700', label: 'Après' },
      defaut: { bg: 'bg-red-100', text: 'text-red-700', label: 'Défaut' },
      progression: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Progression' },
    };
    const { bg, text, label } = config[type];
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${bg} ${text}`}>{label}</span>;
  };

  const filteredPhotos = filterProjet === 'all' 
    ? photos 
    : photos.filter(p => p.projet === filterProjet);

  const projets = [...new Set(photos.map(p => p.projet))];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Camera className="text-purple-600" />
            Photothèque
          </h1>
          <p className="text-gray-600">Galerie photos par projet, annotations et comparaisons</p>
        </div>
        <div className="flex gap-3">
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
            >
              <List size={20} />
            </button>
          </div>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Upload size={18} />
            Importer
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total photos</p>
            <Image size={20} className="text-purple-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{photos.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Albums</p>
            <FolderOpen size={20} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{albums.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Cette semaine</p>
            <Calendar size={20} className="text-green-500" />
          </div>
          <p className="text-2xl font-bold mt-2">12</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Défauts signalés</p>
            <Tag size={20} className="text-red-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-red-600">3</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        {[
          { id: 'photos', label: 'Photos', count: photos.length },
          { id: 'albums', label: 'Albums', count: albums.length },
          { id: 'comparaison', label: 'Avant/Après', count: 4 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg font-medium ${activeTab === tab.id ? 'bg-purple-600 text-white' : 'bg-white border hover:bg-gray-50'}`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Rechercher par titre, tag, zone..." className="w-full pl-10 pr-4 py-2 border rounded-lg" />
          </div>
          <select 
            value={filterProjet}
            onChange={(e) => setFilterProjet(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">Tous les projets</option>
            {projets.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="px-4 py-2 border rounded-lg">
            <option>Toutes les dates</option>
            <option>Cette semaine</option>
            <option>Ce mois</option>
            <option>3 derniers mois</option>
          </select>
          <select className="px-4 py-2 border rounded-lg">
            <option>Tous les types</option>
            <option>Avant</option>
            <option>Progression</option>
            <option>Après</option>
            <option>Défauts</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'photos' && (
        <div className={viewMode === 'grid' ? 'grid grid-cols-4 gap-4' : 'space-y-2'}>
          {filteredPhotos.map(photo => (
            viewMode === 'grid' ? (
              <div 
                key={photo.id} 
                onClick={() => setSelectedPhoto(photo)}
                className="bg-white rounded-xl shadow-sm border overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="aspect-video bg-gray-200 relative">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <Image size={48} />
                  </div>
                  <div className="absolute top-2 right-2">
                    {getTypeBadge(photo.type)}
                  </div>
                </div>
                <div className="p-3">
                  <h4 className="font-medium text-sm truncate">{photo.titre}</h4>
                  <p className="text-xs text-gray-500">{photo.projet}</p>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {photo.date}</span>
                    <span className="flex items-center gap-1"><MapPin size={12} /> {photo.zone}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="bg-white rounded-lg border p-3 flex items-center gap-4 hover:bg-gray-50 cursor-pointer"
              >
                <div className="w-20 h-14 bg-gray-200 rounded flex items-center justify-center">
                  <Image size={24} className="text-gray-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{photo.titre}</h4>
                  <p className="text-sm text-gray-500">{photo.projet} • {photo.zone}</p>
                </div>
                <div className="text-right">
                  {getTypeBadge(photo.type)}
                  <p className="text-xs text-gray-400 mt-1">{photo.date}</p>
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {activeTab === 'albums' && (
        <div className="grid grid-cols-3 gap-4">
          {albums.map(album => (
            <div key={album.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md cursor-pointer">
              <div className="aspect-video bg-gray-200 relative">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <FolderOpen size={48} />
                </div>
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {album.photosCount} photos
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-semibold">{album.nom}</h4>
                <p className="text-sm text-gray-500">{album.projet}</p>
                <p className="text-xs text-gray-400 mt-2">{album.dateDebut} → {album.dateFin}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'comparaison' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold mb-4">Comparaison Avant/Après - École Primaire</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium mb-2 text-blue-600">AVANT - 2025-09-01</p>
              <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                <Image size={64} className="text-gray-400" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2 text-green-600">APRÈS - 2026-01-05</p>
              <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                <Image size={64} className="text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Photo */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <button 
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <X size={32} />
          </button>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300">
            <ChevronLeft size={48} />
          </button>
          <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300">
            <ChevronRight size={48} />
          </button>
          <div className="max-w-4xl w-full mx-4">
            <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center mb-4">
              <Image size={96} className="text-gray-600" />
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">{selectedPhoto.titre}</h3>
                  <p className="text-gray-500">{selectedPhoto.projet} • {selectedPhoto.zone}</p>
                </div>
                {getTypeBadge(selectedPhoto.type)}
              </div>
              <div className="flex gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Calendar size={14} /> {selectedPhoto.date}</span>
                <span className="flex items-center gap-1"><User size={14} /> {selectedPhoto.auteur}</span>
              </div>
              <div className="flex gap-2 mt-3">
                {selectedPhoto.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 rounded text-xs">{tag}</span>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <button className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm">Télécharger</button>
                <button className="flex-1 py-2 border rounded-lg text-sm">Annoter</button>
                <button className="px-4 py-2 border rounded-lg text-sm text-red-600">Supprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Importer des photos</h2>
              <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="border-2 border-dashed rounded-xl p-8 text-center mb-4">
                <Upload size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="font-medium">Glissez vos photos ici</p>
                <p className="text-sm text-gray-500 mt-1">ou cliquez pour sélectionner</p>
                <input type="file" multiple accept="image/*" className="hidden" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Projet</label>
                  <select className="w-full px-4 py-2 border rounded-lg">
                    <option>Tour Deloitte</option>
                    <option>Centre Bell</option>
                    <option>École Primaire</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select className="w-full px-4 py-2 border rounded-lg">
                    <option>Progression</option>
                    <option>Avant</option>
                    <option>Après</option>
                    <option>Défaut</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Zone</label>
                <input type="text" className="w-full px-4 py-2 border rounded-lg" placeholder="Ex: Niveau 3, Toiture, Entrée..." />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Tags</label>
                <input type="text" className="w-full px-4 py-2 border rounded-lg" placeholder="béton, structure, électrique..." />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setShowUploadModal(false)} className="px-4 py-2 border rounded-lg">Annuler</button>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg">Importer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotothequeModule;
