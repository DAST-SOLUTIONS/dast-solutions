import { PageTitle } from '@/components/PageTitle'
import { useParams } from 'react-router-dom'
import { useState } from 'react'

export function ProjetsEstimation() {
  const { projectId } = useParams<{ projectId: string }>()

  return (
    <div className="animate-fade-in">
      <PageTitle title="Estimation - Takeoff" subtitle="Relevé de quantités sur plans" />

      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center py-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Module Takeoff</h3>
          <p className="text-gray-600 mb-2">Projet ID: {projectId}</p>
          <p className="text-sm text-gray-500">🚧 Interface en développement</p>
        </div>
      </div>
    </div>
  )
}
