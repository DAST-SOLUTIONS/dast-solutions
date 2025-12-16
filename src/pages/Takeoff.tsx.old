// src/pages/Takeoff.tsx
import { useParams, useNavigate } from 'react-router-dom'
import { useTakeoffItems } from '@/hooks/useTakeoffItems'
import { useProjects } from '@/hooks/useProjects'
import { useState, useMemo } from 'react'
import { Plus, Trash2, Download, FileSpreadsheet } from 'lucide-react'
import { PageTitle } from '@/components/PageTitle'
import { fmtMoney, fmtQty } from '@/utils/format'
import { useToast } from '@/components/ToastProvider'

// === Pré-requis: imports des libs d'export ===
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

// ✅ Vérification visuelle des pré-requis (regarde la console du navigateur)
console.log('deps OK?', !!jsPDF, !!autoTable, !!XLSX?.utils)

export function Takeoff() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { projects } = useProjects()
  const { items, addItem, deleteItem, totalAmount } = useTakeoffItems(projectId || null)
  const { toast } = useToast()

  const [category, setCategory] = useState('Fondations')
  const [itemName, setItemName] = useState('')
  const [unit, setUnit] = useState('m²')
  const [quantity, setQuantity] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [notes, setNotes] = useState('')

  const project = projects.find(p => p.id === projectId)

  const categories = [
    'Fondations','Charpente','Murs extérieurs','Toiture',
    'Portes/Fenêtres','Électricité','Plomberie','Chauffage',
    'Finitions','Paysagement'
  ]
  const units = ['m²', 'm³', 'm', 'pmp', 'unité', 'kg', 'L']

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemName.trim() || !quantity || !unitPrice) return
    try {
      await addItem(category, itemName, unit, parseFloat(quantity), parseFloat(unitPrice), notes)
      setItemName(''); setQuantity(''); setUnitPrice(''); setNotes('')
      toast('Élément ajouté.', 'success')
    } catch (error) {
      console.error('Error adding item:', error)
      toast('Erreur lors de l’ajout.', 'error')
    }
  }

  // Résumé par catégorie (pour KPI)
  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    items.forEach(it => map.set(it.category, (map.get(it.category) || 0) + it.subtotal))
    return Array.from(map.entries()).map(([cat, sum]) => ({ category: cat, sum }))
  }, [items])

  // --- Export PDF ---
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF()
      doc.text(`Relevé de quantités — ${project?.name || 'Projet'}`, 14, 16)

      const body = items.map(it => [
        it.category,
        it.item_name,
        it.unit,
        it.quantity.toFixed(2),
        it.unit_price.toFixed(2),
        it.subtotal.toFixed(2),
      ])

      autoTable(doc, {
        head: [['Catégorie','Élément','Unité','Quantité','Prix unitaire','Sous-total']],
        body,
        startY: 22
      })

      autoTable(doc, {
        head: [['Catégorie','Total']],
        body: byCategory.map(x => [x.category, x.sum.toFixed(2)]),
        startY: (doc as any).lastAutoTable.finalY + 8,
      })

      doc.text(
        `Total: ${totalAmount.toFixed(2)}  |  Taxes (15%): ${(totalAmount*0.15).toFixed(2)}  |  Grand total: ${(totalAmount*1.15).toFixed(2)}`,
        14,
        (doc as any).lastAutoTable.finalY + 16
      )

      doc.save(`takeoff_${project?.name || 'projet'}.pdf`)
      toast('PDF exporté.', 'success')
    } catch (e) {
      console.error(e)
      toast('Export PDF impossible (vérifiez les pré-requis).', 'error')
    }
  }

  // --- Export XLSX ---
  const handleExportXLSX = () => {
    try {
      const wsData = [
        ['Catégorie','Élément','Unité','Quantité','Prix unitaire','Sous-total'],
        ...items.map(it => [it.category, it.item_name, it.unit, it.quantity, it.unit_price, it.subtotal]),
        [],
        ['Résumé par catégorie'],
        ['Catégorie','Total'],
        ...byCategory.map(x => [x.category, x.sum]),
        [],
        ['Total', totalAmount, 'Taxes (15%)', totalAmount*0.15, 'Grand total', totalAmount*1.15]
      ]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Takeoff')
      XLSX.writeFile(wb, `takeoff_${project?.name || 'projet'}.xlsx`)
      toast('XLSX exporté.', 'success')
    } catch (e) {
      console.error(e)
      toast('Export XLSX impossible (vérifiez les pré-requis).', 'error')
    }
  }

  return (
    <div className="animate-fade-in">
      <PageTitle title="Relevé de quantités" subtitle={project?.name || 'Projet'} />

      {/* Actions */}
      <div className="flex gap-2 mb-6">
        <button onClick={handleExportPDF} className="btn btn-primary flex items-center gap-2">
          <Download size={18} /> Exporter PDF
        </button>
        <button onClick={handleExportXLSX} className="btn btn-secondary flex items-center gap-2">
          <FileSpreadsheet size={18} /> Exporter XLSX
        </button>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">Retour</button>
      </div>

      {/* Formulaire ajout */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Ajouter un élément</h2>
        <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field">
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'élément</label>
            <input
              type="text"
              placeholder="Ex: Béton 4 pouces"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unité</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className="input-field">
              {units.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
            <input
              type="number"
              step="0.01"
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prix unitaire ($)</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
            <input
              type="text"
              placeholder="Notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="md:col-span-2">
            <button type="submit" className="btn btn-primary w-full flex items-center justify-center gap-2">
              <Plus size={20} /> Ajouter l'élément
            </button>
          </div>
        </form>
      </div>

      {/* Tableau items */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {items.length === 0 ? (
          <div className="p-8 text-center text-gray-600">Aucun élément. Commencez par en ajouter un.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Catégorie</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Élément</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Unité</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Quantité</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Prix unitaire</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Sous-total</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-900">{item.category}</td>
                      <td className="px-6 py-3 text-sm text-gray-900">{item.item_name}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{item.unit}</td>
                      <td className="px-6 py-3 text-sm text-right text-gray-900">{fmtQty(item.quantity)}</td>
                      <td className="px-6 py-3 text-sm text-right text-gray-900">{fmtMoney(item.unit_price)}</td>
                      <td className="px-6 py-3 text-sm text-right font-semibold text-gray-900">{fmtMoney(item.subtotal)}</td>
                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Résumé & totaux */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 border-t">
              {byCategory.map(x => (
                <div key={x.category} className="card p-4">
                  <div className="text-xs text-gray-500 font-semibold">{x.category}</div>
                  <div className="text-xl font-bold">{fmtMoney(x.sum)}</div>
                </div>
              ))}
              <div className="md:col-span-3 bg-gray-50 px-6 py-4 border border-gray-200 rounded-lg flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-2">
                    Total: <span className="text-2xl font-bold text-teal-600">{fmtMoney(totalAmount)}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Taxe (15%): <span className="font-semibold">{fmtMoney(totalAmount * 0.15)}</span>
                  </p>
                  <p className="text-sm text-gray-900 font-bold mt-2">
                    Grand total: {fmtMoney(totalAmount * 1.15)}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
