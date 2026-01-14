/**
 * Hook useCCQRates - Taux horaires CCQ
 */
import { useState, useCallback } from 'react';
import { 
  CCQ_TAUX_2025_2026, 
  CCQ_METIERS, 
  CCQ_SECTEURS,
  type CCQTauxHoraire 
} from '@/services/ccqServiceEnhanced';

export function useCCQRates() {
  const [selectedSecteur, setSelectedSecteur] = useState<string>('CI');
  const [selectedMetier, setSelectedMetier] = useState<string>('electricien');

  const getTaux = useCallback((secteur: string, metier: string): CCQTauxHoraire | null => {
    const tauxSecteur = CCQ_TAUX_2025_2026[secteur as keyof typeof CCQ_TAUX_2025_2026];
    return tauxSecteur ? tauxSecteur[metier] || null : null;
  }, []);

  const currentTaux = getTaux(selectedSecteur, selectedMetier);

  const calculateCost = useCallback((
    secteur: string, 
    metier: string, 
    heures: number, 
    nombreTravailleurs: number = 1
  ) => {
    const taux = getTaux(secteur, metier);
    if (!taux) return null;

    return {
      tauxBase: taux.taux_base,
      totalEmployeur: taux.total_employeur,
      coutTotal: taux.total_employeur * heures * nombreTravailleurs,
      heures,
      nombreTravailleurs
    };
  }, [getTaux]);

  const getAllRatesForSecteur = useCallback((secteur: string) => {
    const tauxSecteur = CCQ_TAUX_2025_2026[secteur as keyof typeof CCQ_TAUX_2025_2026];
    if (!tauxSecteur) return [];
    
    return Object.entries(tauxSecteur).map(([code, taux]) => {
      const metier = CCQ_METIERS.find(m => m.code.toLowerCase() === code);
      return {
        code,
        nom: metier?.nom || code,
        ...taux
      };
    });
  }, []);

  return {
    selectedSecteur,
    setSelectedSecteur,
    selectedMetier,
    setSelectedMetier,
    currentTaux,
    getTaux,
    calculateCost,
    getAllRatesForSecteur,
    metiers: CCQ_METIERS,
    secteurs: CCQ_SECTEURS,
    taux: CCQ_TAUX_2025_2026
  };
}

export default useCCQRates;
