import React, { useState } from 'react';
import { HardHat, Search } from 'lucide-react';
import { CCQ_METIERS, CCQ_SECTEURS, CCQ_TAUX_2025_2026 } from '@/services/ccqServiceEnhanced';

export default function CCQNavigator() {
  const [selectedSecteur, setSelectedSecteur] = useState('CI');
  const [search, setSearch] = useState('');

  const taux = CCQ_TAUX_2025_2026[selectedSecteur] || {};

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <HardHat className="w-7 h-7" /> Taux CCQ 2025-2026
      </h1>

      <div className="flex gap-4 mb-6">
        {CCQ_SECTEURS.map(s => (
          <button key={s.code} onClick={() => setSelectedSecteur(s.code)}
            className={`px-4 py-2 rounded-lg ${selectedSecteur === s.code ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
            {s.nom}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4">Métier</th>
              <th className="text-right p-4">Taux base</th>
              <th className="text-right p-4">Vacances</th>
              <th className="text-right p-4">Total employeur</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {Object.entries(taux).map(([metier, t]) => (
              <tr key={metier} className="hover:bg-gray-50">
                <td className="p-4 font-medium capitalize">{metier}</td>
                <td className="p-4 text-right">{t.taux_base.toFixed(2)} $</td>
                <td className="p-4 text-right">{t.vacances.toFixed(2)} $</td>
                <td className="p-4 text-right font-bold">{t.total_employeur.toFixed(2)} $</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
