import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { CCQHourlyRate, CCQTrade, CCQSector, CurrentCCQRate } from '@/types/ccq-types'

export function useCCQRates() {
  const [rates, setRates] = useState<CCQHourlyRate[]>([])
  const [trades, setTrades] = useState<CCQTrade[]>([])
  const [sectors, setSectors] = useState<CCQSector[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger les métiers
  const fetchTrades = async () => {
    const { data, error } = await supabase
      .from('ccq_trades')
      .select('*')
      .eq('is_active', true)
      .order('name_fr')
    
    if (error) throw error
    setTrades(data || [])
  }

  // Charger les secteurs
  const fetchSectors = async () => {
    const { data, error } = await supabase
      .from('ccq_sectors')
      .select('*')
      .eq('is_active', true)
      .order('name_fr')
    
    if (error) throw error
    setSectors(data || [])
  }

  // Charger les taux actuels
  const fetchCurrentRates = async () => {
    const { data, error } = await supabase
      .from('v_ccq_current_rates')
      .select('*')
    
    if (error) throw error
    setRates(data || [])
  }

  // Obtenir le taux pour un métier/secteur spécifique
  const getRate = async (tradeCode: string, sectorCode: string): Promise<CurrentCCQRate | null> => {
    const { data, error } = await supabase
      .from('v_ccq_current_rates')
      .select('*')
      .eq('trade_code', tradeCode)
      .eq('sector_code', sectorCode)
      .single()
    
    if (error) {
      console.error('Error fetching rate:', error)
      return null
    }
    
    return data
  }

  // Calculer le coût total d'un employé
  const calculateEmployeeCost = async (
    tradeCode: string,
    sectorCode: string,
    hoursWorked: number,
    date?: string
  ) => {
    const { data, error } = await supabase.rpc('calculate_total_employee_cost', {
      p_trade_code: tradeCode,
      p_sector_code: sectorCode,
      p_hours_worked: hoursWorked,
      p_date: date || new Date().toISOString()
    })
    
    if (error) throw error
    return data
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        await Promise.all([
          fetchTrades(),
          fetchSectors(),
          fetchCurrentRates()
        ])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load CCQ data')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  return {
    rates,
    trades,
    sectors,
    loading,
    error,
    getRate,
    calculateEmployeeCost,
    refetch: () => {
      fetchTrades()
      fetchSectors()
      fetchCurrentRates()
    }
  }
}
