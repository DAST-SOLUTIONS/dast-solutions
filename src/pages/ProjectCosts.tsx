import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useCosts } from '@/hooks/useCosts'
import { useProjects } from '@/hooks/useProjects'
const ProjectCosts: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  
  const { projects } = useProjects()
  const {
    materials, labor, equipment, subcontractors, overhead, loading, calculateSummary,
    addMaterial, deleteMaterial, addLabor, deleteLabor, addEquipment, deleteEquipment,
    addSubcontractor, deleteSubcontractor, addOverhead, deleteOverhead,
  } = useCosts(projectId || null)
  const project = projects.find((p) => p.id === projectId)
  const summary = calculateSummary()
  // États des formulaires (similaire à useCosts.ts)
  const [newMaterial, setNewMaterial] = useState({
    category: '', description: '', unit: 'm²', quantity: '', unit_price: '', notes: '',
  })
  // ... autres états (newLabor, newEquipment, newSubcontractor, newOverhead)
  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    await addMaterial({
      project_id: projectId || '',
      category: newMaterial.category,
      description: newMaterial.description,
      unit: newMaterial.unit,
      quantity: parseFloat(newMaterial.quantity),
      unit_price: parseFloat(newMaterial.unit_price),
      notes: newMaterial.notes || null,
    })
    setNewMaterial({ category: '', description: '', unit: 'm²', quantity: '', unit_price: '', notes: '' })
  }
  if (loading) return <div>Chargement...</div>
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={24} />
          </button>
        </div>
      </header>
      // ... reste du composant (affichage des coûts, formulaires, etc.)
    </div>
  )
}
export default ProjectCosts