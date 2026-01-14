import React, { useState } from 'react';
import { Camera, MapPin, Clock, Send } from 'lucide-react';

export default function MobileRapportTerrain() {
  const [notes, setNotes] = useState('');

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Camera className="w-6 h-6" /> Rapport de terrain
      </h1>

      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">Localisation actuelle</span>
          </div>
          <button className="w-full py-2 border-2 border-dashed rounded-lg text-gray-500">
            Obtenir la position
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Camera className="w-4 h-4" />
            <span className="text-sm">Photos</span>
          </div>
          <button className="w-full py-8 border-2 border-dashed rounded-lg text-gray-500">
            + Ajouter des photos
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <label className="block text-sm text-gray-500 mb-2">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="w-full px-3 py-2 border rounded-lg" placeholder="Observations..." />
        </div>

        <button className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg">
          <Send className="w-5 h-5" /> Envoyer le rapport
        </button>
      </div>
    </div>
  );
}
