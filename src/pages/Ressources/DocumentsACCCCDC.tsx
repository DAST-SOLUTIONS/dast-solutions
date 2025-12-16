/**
 * DAST Solutions - Documents CCDC
 * Contrats types de construction CCDC/CCAQ
 */
import { PageTitle } from '@/components/PageTitle'
import { FileText, Download, ExternalLink, Info, CheckCircle, DollarSign, Calendar, Users } from 'lucide-react'

const DOCUMENTS = [
  { id: 'ccdc2', name: 'CCDC 2 - Contrat à forfait', description: 'Contrat standard pour projets à prix fixe', price: 'Variable', usage: 'Projets commerciaux et institutionnels' },
  { id: 'ccdc3', name: 'CCDC 3 - Coût majoré', description: 'Contrat à coût remboursable avec honoraires', price: 'Variable', usage: 'Projets complexes ou urgents' },
  { id: 'ccdc4', name: 'CCDC 4 - Contrat unitaire', description: 'Contrat basé sur prix unitaires', price: 'Variable', usage: 'Travaux de génie civil' },
  { id: 'ccdc5a', name: 'CCDC 5A - Construction-gestion', description: 'Services de gestion de construction', price: 'Variable', usage: 'Grands projets' },
  { id: 'ccdc5b', name: 'CCDC 5B - Gérant de construction', description: 'Gérant agissant comme entrepreneur', price: 'Variable', usage: 'Projets institutionnels majeurs' },
  { id: 'ccdc14', name: 'CCDC 14 - Design-construction', description: 'Conception et construction intégrées', price: 'Variable', usage: 'Projets clé en main' },
  { id: 'ccq1', name: 'CCQ 1 - Conditions générales', description: 'Conditions générales pour contrats publics québécois', price: 'Gratuit', usage: 'Projets publics au Québec' },
]

export default function DocumentsCCDC() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <PageTitle title="Documents CCDC" />
        <p className="text-gray-500 mt-1">Contrats types de construction canadiens</p>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-800 font-medium">Documents officiels CCDC</p>
          <p className="text-sm text-blue-700">Les documents CCDC sont publiés conjointement par l'Association canadienne de la construction et le Comité canadien des documents de construction. Visitez <a href="https://www.ccdc.org" target="_blank" className="underline">ccdc.org</a> pour les obtenir.</p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {DOCUMENTS.map(doc => (
          <div key={doc.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-teal-50 rounded-lg"><FileText size={24} className="text-teal-600" /></div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{doc.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><DollarSign size={14} />{doc.price}</span>
                  <span className="flex items-center gap-1"><Users size={14} />{doc.usage}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <a href="https://www.ccdc.org" target="_blank" className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"><Download size={16} />Obtenir</a>
              <a href="https://www.ccdc.org" target="_blank" className="px-3 py-2 border rounded-lg hover:bg-gray-50"><ExternalLink size={16} /></a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
