import React from 'react';
import { FileText, Download, Eye } from 'lucide-react';
import { useSoumissions } from '@/hooks/useSoumissions';
import { downloadSoumissionPDF, openSoumissionPDF } from '@/services/pdfSoumissionService';

export default function BidProposalV2() {
  const { soumissions, loading } = useSoumissions();

  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FileText className="w-7 h-7" /> Propositions / Soumissions
      </h1>

      <div className="space-y-4">
        {soumissions.map(soumission => (
          <div key={soumission.id} className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{soumission.titre}</p>
                <p className="text-sm text-gray-500">{soumission.numero} - {soumission.client_name}</p>
                <p className="text-lg font-bold mt-2">{soumission.montant_total?.toLocaleString()} $</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openSoumissionPDF(soumission)} className="p-2 hover:bg-gray-100 rounded">
                  <Eye className="w-5 h-5" />
                </button>
                <button onClick={() => downloadSoumissionPDF(soumission)} className="p-2 hover:bg-gray-100 rounded">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
