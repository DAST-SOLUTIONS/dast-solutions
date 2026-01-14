/**
 * Hook useSoumissionPDF - Génération PDF des soumissions
 */
import { useState, useCallback } from 'react';
import type { Soumission } from './useSoumissions';

export function useSoumissionPDF() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePDF = useCallback(async (soumission: Soumission): Promise<Blob | null> => {
    setLoading(true);
    setError(null);
    try {
      const { pdfSoumissionService } = await import('@/services/pdfSoumissionService');
      const blob = await pdfSoumissionService.generatePDF(soumission);
      return blob;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadPDF = useCallback(async (soumission: Soumission, filename?: string) => {
    const blob = await generatePDF(soumission);
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `soumission-${soumission.numero}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [generatePDF]);

  const previewPDF = useCallback(async (soumission: Soumission) => {
    const blob = await generatePDF(soumission);
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }, [generatePDF]);

  return {
    loading,
    error,
    generatePDF,
    downloadPDF,
    previewPDF
  };
}

export default useSoumissionPDF;
