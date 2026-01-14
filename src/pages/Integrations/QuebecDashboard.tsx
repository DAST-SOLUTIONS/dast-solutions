import React from 'react';
import { MapPin, Building2, HardHat, FileSearch } from 'lucide-react';

export default function QuebecDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <MapPin className="w-7 h-7" /> Intégrations Québec
      </h1>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
            <h2 className="text-xl font-semibold">RBQ</h2>
          </div>
          <p className="text-gray-600 mb-4">Vérification des licences d'entrepreneur en construction</p>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Connecté</span>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <HardHat className="w-8 h-8 text-yellow-600" />
            <h2 className="text-xl font-semibold">CCQ</h2>
          </div>
          <p className="text-gray-600 mb-4">Taux horaires et conventions collectives</p>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Connecté</span>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileSearch className="w-8 h-8 text-purple-600" />
            <h2 className="text-xl font-semibold">SEAO</h2>
          </div>
          <p className="text-gray-600 mb-4">Système électronique d'appel d'offres</p>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Connecté</span>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-8 h-8 text-red-600" />
            <h2 className="text-xl font-semibold">Taxes QC</h2>
          </div>
          <p className="text-gray-600 mb-4">TPS 5% + TVQ 9.975%</p>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Configuré</span>
        </div>
      </div>
    </div>
  );
}
