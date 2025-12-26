/**
 * Redirection vers Soumissions V2
 * Ce fichier remplace l'ancien module Soumissions
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Soumissions() {
  const navigate = useNavigate()
  
  useEffect(() => {
    navigate('/soumissions-v2', { replace: true })
  }, [navigate])
  
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-500">Redirection vers Soumissions V2...</p>
    </div>
  )
}
