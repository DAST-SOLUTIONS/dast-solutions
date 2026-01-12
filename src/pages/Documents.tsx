import React, { useState } from 'react';
import { 
  FileText, FolderOpen, Upload, Download, Search, Filter,
  MoreVertical, Eye, Trash2, Share2, Clock, User,
  File, FileImage, FileSpreadsheet, Archive
} from 'lucide-react';

interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'dwg' | 'xlsx' | 'docx' | 'image' | 'archive';
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  project: string;
  category: string;
}

const Documents: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const documents: Document[] = [
    { id: '1', name: 'Plans architecturaux - Tour Deloitte.pdf', type: 'pdf', size: '24.5 MB', uploadedBy: 'Jean Tremblay', uploadedAt: '2026-01-10', project: 'Tour Deloitte', category: 'Plans' },
    { id: '2', name: 'Devis structural.xlsx', type: 'xlsx', size: '1.2 MB', uploadedBy: 'Marie Dubois', uploadedAt: '2026-01-09', project: 'Tour Deloitte', category: 'Devis' },
    { id: '3', name: 'Coupe A-A.dwg', type: 'dwg', size: '8.7 MB', uploadedBy: 'Pierre Martin', uploadedAt: '2026-01-08', project: 'Centre Bell', category: 'Plans' },
    { id: '4', name: 'Rapport inspection.docx', type: 'docx', size: '542 KB', uploadedBy: 'Sophie Lavoie', uploadedAt: '2026-01-07', project: 'Hôpital Sainte-Justine', category: 'Rapports' },
    { id: '5', name: 'Photos chantier.zip', type: 'archive', size: '156 MB', uploadedBy: 'Luc Gagnon', uploadedAt: '2026-01-06', project: 'Tour Deloitte', category: 'Photos' },
    { id: '6', name: 'Facade-Nord.jpg', type: 'image', size: '3.2 MB', uploadedBy: 'Jean Tremblay', uploadedAt: '2026-01-05', project: 'Centre Bell', category: 'Photos' },
  ];

  const categories = [
    { id: 'all', name: 'Tous', count: documents.length },
    { id: 'Plans', name: 'Plans', count: documents.filter(d => d.category === 'Plans').length },
    { id: 'Devis', name: 'Devis', count: documents.filter(d => d.category === 'Devis').length },
    { id: 'Rapports', name: 'Rapports', count: documents.filter(d => d.category === 'Rapports').length },
    { id: 'Photos', name: 'Photos', count: documents.filter(d => d.category === 'Photos').length },
  ];

  const getFileIcon = (type: string) => {
    switch(type) {
      case 'pdf': return <FileText className="text-red-500" size={20} />;
      case 'xlsx': return <FileSpreadsheet className="text-green-500" size={20} />;
      case 'dwg': return <File className="text-blue-500" size={20} />;
      case 'docx': return <FileText className="text-blue-600" size={20} />;
      case 'image': return <FileImage className="text-purple-500" size={20} />;
      case 'archive': return <Archive className="text-yellow-500" size={20} />;
      default: return <File className="text-gray-500" size={20} />;
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.project.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FolderOpen className="text-blue-600" />
            Gestion Documentaire
          </h1>
          <p className="text-gray-600">Gérez tous vos documents de projet</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Upload size={18} />
          Téléverser
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Total documents</p>
          <p className="text-2xl font-bold">{documents.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Plans</p>
          <p className="text-2xl font-bold text-blue-600">{documents.filter(d => d.category === 'Plans').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Cette semaine</p>
          <p className="text-2xl font-bold text-green-600">12</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Stockage utilisé</p>
          <p className="text-2xl font-bold">2.4 GB</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold mb-4">Catégories</h3>
          <div className="space-y-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left ${
                  selectedCategory === cat.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                }`}
              >
                <span>{cat.name}</span>
                <span className="text-sm text-gray-500">{cat.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-3 bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher un document..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
              <Filter size={18} />
              Filtres
            </button>
          </div>

          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-gray-500">Nom</th>
                <th className="text-left p-3 text-sm font-medium text-gray-500">Projet</th>
                <th className="text-left p-3 text-sm font-medium text-gray-500">Taille</th>
                <th className="text-left p-3 text-sm font-medium text-gray-500">Ajouté par</th>
                <th className="text-left p-3 text-sm font-medium text-gray-500">Date</th>
                <th className="text-center p-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((doc) => (
                <tr key={doc.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {getFileIcon(doc.type)}
                      <span className="font-medium">{doc.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-gray-600">{doc.project}</td>
                  <td className="p-3 text-gray-600">{doc.size}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-gray-400" />
                      <span className="text-gray-600">{doc.uploadedBy}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-gray-400" />
                      <span className="text-gray-600">{doc.uploadedAt}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      <button className="p-2 hover:bg-gray-100 rounded-lg" title="Voir">
                        <Eye size={16} className="text-gray-500" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg" title="Télécharger">
                        <Download size={16} className="text-gray-500" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg" title="Partager">
                        <Share2 size={16} className="text-gray-500" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg" title="Plus">
                        <MoreVertical size={16} className="text-gray-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredDocuments.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <FileText size={48} className="mx-auto text-gray-300 mb-3" />
              <p>Aucun document trouvé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Documents;
