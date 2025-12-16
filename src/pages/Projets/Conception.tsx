/**
 * DAST Solutions - Conception
 * Outils de conception et planification
 */
import { PageTitle } from '@/components/PageTitle'
import { Compass, Layers, Box, Ruler, PenTool, Grid, Move, RotateCw, ZoomIn, Palette, Download, Upload, Share2, Save, Undo, Redo, Eye, Settings } from 'lucide-react'

export default function Conception() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div><PageTitle title="Conception" /><p className="text-gray-500 mt-1">Outils de conception et planification 3D</p></div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Upload size={18} />Importer</button>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"><Save size={18} />Sauvegarder</button>
        </div>
      </div>
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-semibold mb-4">Outils</h3>
          <div className="space-y-2">
            {[{ icon: Move, label: 'Sélection' }, { icon: PenTool, label: 'Dessiner' }, { icon: Box, label: '3D Box' }, { icon: Ruler, label: 'Mesurer' }, { icon: Grid, label: 'Grille' }, { icon: Layers, label: 'Calques' }].map(t => (
              <button key={t.label} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-left">
                <t.icon size={18} className="text-gray-500" /><span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="lg:col-span-3 bg-white rounded-xl border overflow-hidden">
          <div className="p-3 border-b flex items-center justify-between">
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded"><Undo size={18} /></button>
              <button className="p-2 hover:bg-gray-100 rounded"><Redo size={18} /></button>
              <div className="w-px h-6 bg-gray-200 mx-2" />
              <button className="p-2 hover:bg-gray-100 rounded"><ZoomIn size={18} /></button>
              <button className="p-2 hover:bg-gray-100 rounded"><RotateCw size={18} /></button>
              <button className="p-2 hover:bg-gray-100 rounded"><Eye size={18} /></button>
            </div>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded"><Palette size={18} /></button>
              <button className="p-2 hover:bg-gray-100 rounded"><Settings size={18} /></button>
            </div>
          </div>
          <div className="h-[600px] bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Compass size={64} className="mx-auto mb-4 text-gray-300" />
              <p className="font-medium">Zone de conception 3D</p>
              <p className="text-sm">Intégration Three.js / BIM Viewer à venir</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
