import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface Project {
  id: string
  name: string
  description: string | null
  status: string
  created_at: string
  updated_at: string
  project_type: string | null
  client_name: string | null
  project_number: string | null
  address: string | null
  start_date: string | null
  end_date: string | null
  project_value: number | null
  timezone: string | null
}

export function useProjects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setProjects(data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch projects'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()

    if (!user) return

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`projects:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchProjects()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const createProject = async (
  name: string,
  description?: string,
  projectType?: string,
  clientName?: string,
  projectNumber?: string,
  address?: string,
  startDate?: string,
  endDate?: string,
  projectValue?: number,
  timezone?: string
) => {
  if (!user) throw new Error('Not authenticated')

  try {
    const { data, error: createError } = await supabase
      .from('projects')
      .insert([
        {
          user_id: user.id,
          name,
          description: description || null,
          project_type: projectType || 'Résidentiel',
          client_name: clientName || null,
          project_number: projectNumber || null,
          address: address || null,
          start_date: startDate || null,
          end_date: endDate || null,
          project_value: projectValue || null,
          timezone: timezone || 'America/Toronto',
        },
      ])
      .select()
      .single()

    if (createError) throw createError
    return data
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create project'
    setError(message)
    throw err
  }
}

  const updateProject = async (
  projectId: string,
  updates: Partial<Project>
) => {
  try {
    const { data, error: updateError } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .eq('user_id', user?.id)
      .select()
      .single()

    if (updateError) throw updateError
    return data
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update project'
    setError(message)
    throw err
  }
}

  const deleteProject = async (projectId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user?.id)

      if (deleteError) throw deleteError
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete project'
      setError(message)
      throw err
    }
  }

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects,
  }
}