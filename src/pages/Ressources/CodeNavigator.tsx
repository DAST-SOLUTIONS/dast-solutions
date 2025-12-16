/**
 * DAST Solutions - Navigateur de codes
 * Navigation dans les codes du bâtiment
 */
import { useState } from 'react'
import { PageTitle } from '@/components/PageTitle'
import { Search, Book, ChevronRight, ChevronDown, ExternalLink, FileText, Bookmark, Star, Download, Filter } from 'lucide-react'

const CODE_SECTIONS = [
  { id: '1', code: 'CNB', title: 'Code national du bâtiment', version: '2020', sections: [
    { id: '1.1', title: 'Division A - Conformité', subsections: ['Objectifs et énoncés fonctionnels', 'Application', 'Définitions'] },
    { id: '1.2', title: 'Division B - Solutions acceptables', subsections: ['Protection incendie', 'Sécurité', 'Salubrité', 'Accessibilité'] },
    { id: '1.3', title: 'Division C - Dispositions administratives', subsections: ['Demandes de permis', 'Dessins et devis'] },
  ]},
  { id: '2', code: 'CCQ', title: 'Code de construction du Québec', version: '2021', sections: [
    { id: '2.1', title: 'Chapitre I - Bâtiment', subsections: ['Exigences générales', 'Construction combustible', 'Construction incombustible'] },
    { id: '2.2', title: 'Chapitre II - Gaz', subsections: ['Installation', 'Ventilation', 'Évacuation'] },
    { id: '2.3', title: 'Chapitre III - Plomberie', subsections: ['Alimentation en eau', 'Évacuation', 'Appareils sanitaires'] },
  ]},
  { id: '3', code: 'CNÉB', title: 'Code national de l\'énergie', version: '2020', sections: [
    { id: '3.1', title: 'Enveloppe du bâtiment', subsections: ['Isolation thermique', 'Étanchéité à l\'air', 'Fenestration'] },
    { id: '3.2', title: 'Systèmes mécaniques', subsections: ['Chauffage', 'Ventilation', 'Climatisation'] },
  ]},
]

export default function CodeNavigator() {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string[]>(['1'])

  const toggleExpand = (id: string) => setExpanded(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div><PageTitle title="Navigateur de codes" /><p className="text-gray-500 mt-1">Codes du bâtiment et réglementations</p></div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Bookmark size={18} />Favoris</button>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"><Download size={18} />Télécharger</button>
        </div>
      </div>
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Rechercher dans les codes..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" /></div>
      </div>
      <div className="space-y-4">
        {CODE_SECTIONS.map(code => (
          <div key={code.id} className="bg-white rounded-xl border overflow-hidden">
            <button onClick={() => toggleExpand(code.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <Book size={20} className="text-teal-600" />
                <div className="text-left"><div className="font-semibold">{code.title}</div><div className="text-sm text-gray-500">{code.code} - Version {code.version}</div></div>
              </div>
              {expanded.includes(code.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </button>
            {expanded.includes(code.id) && (
              <div className="border-t bg-gray-50 p-4">
                {code.sections.map(section => (
                  <div key={section.id} className="mb-4 last:mb-0">
                    <div className="font-medium text-gray-900 mb-2">{section.title}</div>
                    <div className="pl-4 space-y-1">
                      {section.subsections.map((sub, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-gray-600 py-1 px-2 hover:bg-white rounded cursor-pointer">
                          <FileText size={14} className="text-gray-400" />{sub}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
