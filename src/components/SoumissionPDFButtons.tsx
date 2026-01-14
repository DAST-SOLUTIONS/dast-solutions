/**
 * SoumissionPDFButtons Component - PDF generation buttons for soumissions
 */
import React, { useState } from 'react';
import { FileText, Download, Eye } from 'lucide-react';
import { downloadSoumissionPDF, openSoumissionPDF } from '@/services/pdfSoumissionService';
import type { Soumission } from '@/hooks/useSoumissions';

interface SoumissionPDFButtonsProps {
  soumission: Soumission;
}

export function SoumissionPDFButtons({ soumission }: SoumissionPDFButtonsProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      await downloadSoumissionPDF(soumission);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    setLoading(true);
    try {
      await openSoumissionPDF(soumission);
    } catch (error) {
      console.error('Preview failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handlePreview}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
      >
        <Eye className="w-4 h-4" />
        Aperçu
      </button>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
      >
        <Download className="w-4 h-4" />
        Télécharger PDF
      </button>
    </div>
  );
}

export default SoumissionPDFButtons;
