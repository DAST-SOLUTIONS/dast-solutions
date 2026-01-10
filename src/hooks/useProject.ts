/**
 * DAST Solutions - Hook useProject
 * Hook partagé pour charger le projet courant
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export interface Project {
  id: string
  name: string
  status: string
  client_name?: string
  address?: string
  city?: string
  province?: string
  budget?: number
  start_date?: string
  end_date?: string
  phase?: string
  visibility?: string
}

export function useProject() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!projectId) {
        setLoading(false)
        return
      }
      
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          navigate('/login')
          return
        }

        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .eq('user_id', user.id)
          .single()

        if (error || !data) {
          navigate('/projects')
          return
        }
        setProject(data)
      } catch (err) {
        console.error('Erreur chargement projet:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectId, navigate])

  return { project, loading, projectId }
}

export default useProject
