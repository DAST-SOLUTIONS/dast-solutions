import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface TakeoffItem {
  id: string
  project_id: string
  category: string
  item_name: string
  unit: string
  quantity: number
  unit_price: number
  subtotal: number
  notes: string | null
  created_at: string
  updated_at: string
}

export function useTakeoffItems(projectId: string | null) {
  const [items, setItems] = useState<TakeoffItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchItems = async () => {
    if (!projectId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('takeoff_items')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setItems(data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch items'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()

    if (!projectId) return

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`takeoff:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'takeoff_items',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchItems()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId])

  const addItem = async (
    category: string,
    itemName: string,
    unit: string,
    quantity: number,
    unitPrice: number,
    notes?: string
  ) => {
    if (!projectId) throw new Error('No project selected')

    try {
      const { data, error: insertError } = await supabase
        .from('takeoff_items')
        .insert([
          {
            project_id: projectId,
            category,
            item_name: itemName,
            unit,
            quantity: parseFloat(quantity.toString()),
            unit_price: parseFloat(unitPrice.toString()),
            notes: notes || null,
          },
        ])
        .select()
        .single()

      if (insertError) throw insertError
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add item'
      setError(message)
      throw err
    }
  }

  const updateItem = async (
    itemId: string,
    updates: Partial<TakeoffItem>
  ) => {
    try {
      const { data, error: updateError } = await supabase
        .from('takeoff_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single()

      if (updateError) throw updateError
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update item'
      setError(message)
      throw err
    }
  }

  const deleteItem = async (itemId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('takeoff_items')
        .delete()
        .eq('id', itemId)

      if (deleteError) throw deleteError
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete item'
      setError(message)
      throw err
    }
  }

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0)

  return {
    items,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    refetch: fetchItems,
    totalQuantity,
    totalAmount,
  }
}