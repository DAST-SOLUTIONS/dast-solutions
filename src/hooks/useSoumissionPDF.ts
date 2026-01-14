import { generateSoumissionPDF, downloadSoumissionPDF, openSoumissionPDF } from '@/services/pdfSoumissionService';
import type { Soumission } from './useSoumissions';

export function useSoumissionPDF() {
  const generate = async (soumission: Soumission) => generateSoumissionPDF(soumission);
  const download = async (soumission: Soumission) => downloadSoumissionPDF(soumission);
  const open = async (soumission: Soumission) => openSoumissionPDF(soumission);
  return { generate, download, open, generateSoumissionPDF, downloadSoumissionPDF, openSoumissionPDF };
}
export default useSoumissionPDF;
