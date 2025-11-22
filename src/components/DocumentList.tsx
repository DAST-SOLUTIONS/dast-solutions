import { useState } from "react"
import { MoreVertical, Download, Trash2 } from "lucide-react"

type Props = { projectId: string }
type Doc = { id: string; name: string; type: string; size: number; created_at: string; url?: string }

export function DocumentList({ projectId }: Props) {
  // TODO: brancher sur ton hook réel (tu l’avais déjà)
  const [docs] = useState<Doc[]>([]) // placeholder

  const typeColor = (t: string) =>
    t === 'PDF' ? 'bg-red-100 text-red-700' :
    t === 'DWG' ? 'bg-indigo-100 text-indigo-700' :
    t === 'RVT' ? 'bg-emerald-100 text-emerald-700' :
    t === 'IFC' ? 'bg-amber-100 text-amber-700' :
    'bg-gray-100 text-gray-700'

  return (
    <div className="space-y-3">
      {docs.length === 0 && <p className="text-gray-500">Aucun document pour le moment.</p>}

      {docs.map((d) => (
        <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50">
          <div className="min-w-0">
            <div className="font-medium text-gray-800 truncate">{d.name}</div>
            <div className="text-xs text-gray-500">{(d.size/1024).toFixed(1)} Ko • {new Date(d.created_at).toLocaleDateString('fr-CA')}</div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${typeColor(d.type)}`}>{d.type}</span>

            <div className="relative group">
              <button className="p-2 rounded hover:bg-gray-200">
                <MoreVertical size={18}/>
              </button>
              <div className="hidden group-hover:block absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow">
                <button className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2">
                  <Download size={16}/> Télécharger
                </button>
                <button className="w-full text-left px-3 py-2 hover:bg-gray-50 text-red-600 flex items-center gap-2">
                  <Trash2 size={16}/> Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
