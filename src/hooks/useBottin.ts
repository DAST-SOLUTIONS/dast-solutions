/**
 * Hook useBottin - Bottin des ressources (entrepreneurs, fournisseurs, etc.)
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface BottinEntry {
  id: string;
  type: 'entrepreneur' | 'fournisseur' | 'professionnel' | 'autre';
  company_name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  specialties?: string[];
  rbq_license?: string;
  rating?: number;
  notes?: string;
}

export function useBottin() {
  const [entries, setEntries] = useState<BottinEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch from multiple tables
      const [entrepreneurs, fournisseurs] = await Promise.all([
        supabase.from('entrepreneurs').select('*').eq('user_id', user.id),
        supabase.from('fournisseurs').select('*').eq('user_id', user.id)
      ]);

      const combined: BottinEntry[] = [
        ...(entrepreneurs.data || []).map(e => ({ ...e, type: 'entrepreneur' as const })),
        ...(fournisseurs.data || []).map(f => ({ ...f, type: 'fournisseur' as const }))
      ];

      setEntries(combined);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = !searchTerm || 
      entry.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.specialties?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || entry.type === filterType;
    
    return matchesSearch && matchesType;
  });

  return {
    entries: filteredEntries,
    allEntries: entries,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    refresh: fetchEntries
  };
}

export default useBottin;
