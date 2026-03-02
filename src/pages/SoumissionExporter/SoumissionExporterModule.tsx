// src/pages/SoumissionExporter/SoumissionExporterModule.tsx
// DAST Solutions - Générateur de soumission basé sur le template Excel
// Reproduit la structure: Recap par div + Sheets par division + Charges générales

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Download, RefreshCw, FileText } from 'lucide-react';
const toast = { success: (m: string) => console.log('✅', m), error: (m: string) => console.error('❌', m) };
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface EstimationLine {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  price_material: number;
  price_labor: number;
  price_equipment: number;
  price_total: number;
  csc_division: string;
  csc_section?: string;
  notes?: string;
}

interface ProjectInfo {
  name: string;
  number: string;
  estimators: string[];
  date: string;
  client?: string;
  address?: string;
  surface_rough?: number;
  surface_net?: number;
  nb_units?: number;
}

interface SubmissionConfig {
  admin_pct: number;
  profit_pct: number;
  contingency_pct: number;
  bond_pct: number;
  insurance_pct: number;
}

const CSC_NAMES: Record<string, string> = {
  '00': 'Conditions Générales',
  '01': 'Exigences Générales',
  '02': "Travaux d'emplacement",
  '03': 'Béton',
  '04': 'Maçonnerie',
  '05': 'Métaux',
  '06': 'Bois, Plastiques et Composites',
  '07': 'Isolation Thermique et Étanchéité',
  '08': 'Ouvertures et Fermetures',
  '09': 'Finitions',
  '10': 'Ouvrages Spéciaux',
  '11': 'Matériel et Équipement',
  '12': 'Ameublement et Décoration',
  '13': 'Bâtiments Spéciaux',
  '14': 'Systèmes Transporteurs',
  '21': 'Lutte contre les Incendies',
  '22': 'Plomberie',
  '23': "Chauffage, Ventilation et Conditionnement de l'air",
  '26': 'Électricité',
  '31': 'Terrassements',
  '32': 'Aménagements Extérieurs',
  '33': "Services d'Utilités",
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function groupByDivision(lines: EstimationLine[]): Record<string, EstimationLine[]> {
  return lines.reduce((acc, line) => {
    const div = line.csc_division ?? 'XX';
    acc[div] = acc[div] ?? [];
    acc[div].push(line);
    return acc;
  }, {} as Record<string, EstimationLine[]>);
}

function divTotal(lines: EstimationLine[]): number {
  return lines.reduce((s, l) => s + l.price_total, 0);
}

// ─────────────────────────────────────────────
// EXCEL EXPORT (reproducing Excel template structure)
// ─────────────────────────────────────────────
export function exportToExcel(
  lines: EstimationLine[],
  project: ProjectInfo,
  config: SubmissionConfig
): void {
  const wb = XLSX.utils.book_new();

  const subtotal = lines.reduce((s, l) => s + l.price_total, 0);
  const bond = subtotal * config.bond_pct;
  const insurance = subtotal * config.insurance_pct;
  const contingency = subtotal * config.contingency_pct;
  const subtotalWithCont = subtotal + bond + insurance + contingency;
  const admin = subtotalWithCont * config.admin_pct;
  const profit = subtotalWithCont * config.profit_pct;
  const total = subtotalWithCont + admin + profit;

  const byDiv = groupByDivision(lines);
  const sortedDivisions = Object.keys(byDiv).sort();

  const fmt = (n: number) => isNaN(n) ? 0 : Math.round(n * 100) / 100;
  const pctFmt = (n: number) => `${(n * 100).toFixed(1)}%`;

  // ── RECAP PAR DIV ──────────────────────────
  const recapRows: unknown[][] = [
    [],
    [null, 'Récapitulatif par section'],
    [],
    [null, 'Section', null, 'Description', null, null, null, null, null, 'Prix', 'Pourcentage', 'Pi2 Rough', 'Pi2 Net'],
  ];

  sortedDivisions.forEach(div => {
    const tot = divTotal(byDiv[div]);
    const pct = total > 0 ? tot / total : 0;
    const perSF = project.surface_rough ? tot / project.surface_rough : 0;
    const perSFNet = project.surface_net ? tot / project.surface_net : 0;
    recapRows.push([null, div, null, CSC_NAMES[div] ?? `Division ${div}`, null, null, null, null, null, fmt(tot), pct, fmt(perSF), fmt(perSFNet)]);
  });

  recapRows.push([]);
  recapRows.push([null, null, null, 'SOUS-TOTAL TRAVAUX', null, null, null, null, null, fmt(subtotal)]);
  recapRows.push([null, null, null, `Cautionnement (${pctFmt(config.bond_pct)})`, null, null, null, null, null, fmt(bond)]);
  recapRows.push([null, null, null, `Assurances (${pctFmt(config.insurance_pct)})`, null, null, null, null, null, fmt(insurance)]);
  recapRows.push([null, null, null, `Contingences (${pctFmt(config.contingency_pct)})`, null, null, null, null, null, fmt(contingency)]);
  recapRows.push([]);
  recapRows.push([null, null, null, `Administration (${pctFmt(config.admin_pct)})`, null, null, null, null, null, fmt(admin)]);
  recapRows.push([null, null, null, `Profit (${pctFmt(config.profit_pct)})`, null, null, null, null, null, fmt(profit)]);
  recapRows.push([]);
  recapRows.push([null, null, null, '** TOTAL SOUMISSION **', null, null, null, null, null, fmt(total)]);

  const wsRecap = XLSX.utils.aoa_to_sheet(recapRows);
  wsRecap['!cols'] = [{ width: 2 }, { width: 8 }, { width: 2 }, { width: 40 }, { width: 8 }, { width: 8 }, { width: 8 }, { width: 8 }, { width: 8 }, { width: 18 }, { width: 12 }, { width: 12 }, { width: 12 }];
  XLSX.utils.book_append_sheet(wb, wsRecap, 'Recap par div');

  // ── SHEET PAR DIVISION ──────────────────────
  sortedDivisions.forEach(div => {
    const divLines = byDiv[div];
    const divName = CSC_NAMES[div] ?? `Division ${div}`;
    const sheetName = divName.substring(0, 30); // Excel sheet name limit

    const rows: unknown[][] = [
      [null, 'Nom:', project.name],
      [null, '#', project.number, null, divName],
      [null, 'Estimateur:', project.estimators.join(' | ')],
      [],
      [null, 'Item', null, 'Qté', 'Unité', "Coût Mat. Unitaire", "Coût Mat. Total", "Coût M-O Unitaire", "Coût M-O Total", "Coût Équip. Total", 'Total'],
    ];

    let divMat = 0, divLabor = 0, divEquip = 0, divTot = 0;

    divLines.forEach(line => {
      rows.push([
        null,
        line.description,
        null,
        fmt(line.quantity),
        line.unit,
        fmt(line.price_material),
        fmt(line.price_material * line.quantity),
        fmt(line.price_labor),
        fmt(line.price_labor * line.quantity),
        fmt(line.price_equipment * line.quantity),
        fmt(line.price_total),
      ]);
      divMat += line.price_material * line.quantity;
      divLabor += line.price_labor * line.quantity;
      divEquip += line.price_equipment * line.quantity;
      divTot += line.price_total;
    });

    rows.push([]);
    rows.push([null, `TOTAL ${divName.toUpperCase()}`, null, null, null, null, fmt(divMat), null, fmt(divLabor), fmt(divEquip), fmt(divTot)]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ width: 2 }, { width: 45 }, { width: 2 }, { width: 12 }, { width: 8 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 18 }];
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  // ── CHARGES GÉNÉRALES (EG) ──────────────────
  const egRows: unknown[][] = [
    [null, 'Nom:', project.name, null, null, null, null, 'Nb pi2 total (rough):', null, project.surface_rough ?? '', fmt(project.surface_rough ? total / project.surface_rough : 0), null, 'par pi2'],
    [null, '#', project.number, null, null, null, null, 'Nb pi2 total (net):', null, project.surface_net ?? '', fmt(project.surface_net ? total / project.surface_net : 0), null, 'par pi2'],
    [null, 'Estimateur:', project.estimators.join(' | '), null, null, null, null, 'Nb unités:', null, project.nb_units ?? '', fmt(project.nb_units ? total / project.nb_units : 0), null, 'par unité'],
    [],
    [null, 'Section', null, 'Description', null, null, null, null, null, null, null, null, null, 'Prix', 'Prix Retenu'],
  ];

  sortedDivisions.forEach(div => {
    const tot = divTotal(byDiv[div]);
    egRows.push([null, div, null, CSC_NAMES[div] ?? `Division ${div}`, null, null, null, null, null, null, null, null, null, fmt(tot), fmt(tot)]);
  });

  egRows.push([]);
  egRows.push([null, null, null, 'SOUS-TOTAL', null, null, null, null, null, null, null, null, null, fmt(subtotal), fmt(subtotal)]);
  egRows.push([null, null, null, 'Charges générales', null, null, null, null, null, null, null, null, null, fmt(admin + profit + bond + insurance + contingency), fmt(admin + profit + bond + insurance + contingency)]);
  egRows.push([null, null, null, '** TOTAL **', null, null, null, null, null, null, null, null, null, fmt(total), fmt(total)]);

  const wsEG = XLSX.utils.aoa_to_sheet(egRows);
  XLSX.utils.book_append_sheet(wb, wsEG, 'EG');

  // ── LISTE DÉROULANTE (Unités) ────────────────
  const unitsRows = [
    ['PI', 'Pied linéaire'],
    ['PI2', 'Pied carré'],
    ['PI3', 'Pied cube'],
    ['M', 'Mètre linéaire'],
    ['M2', 'Mètre carré'],
    ['M3', 'Mètre cube'],
    ['T', 'Tonne métrique'],
    ['KG', 'Kilogramme'],
    ['LBS', 'Livres'],
    ['U', 'Unité'],
    ['HR', 'Heure'],
    ['JR', 'Jour'],
    ['SAC', 'Sac'],
    ['BOX', 'Boîte'],
    ['RLX', 'Rouleau'],
    ['LOT', 'Lot'],
  ];
  const wsUnits = XLSX.utils.aoa_to_sheet(unitsRows);
  XLSX.utils.book_append_sheet(wb, wsUnits, 'Liste déroulante');

  // ── EXPORT ──────────────────────────────────
  const filename = `${project.number}-${project.name.replace(/[^a-zA-Z0-9]/g, '_')}-Soumission.xlsx`;
  XLSX.writeFile(wb, filename);
  toast.success(`Soumission exportée: ${filename}`);
}

// ─────────────────────────────────────────────
// PDF EXPORT
// ─────────────────────────────────────────────
export function exportToPDF(
  lines: EstimationLine[],
  project: ProjectInfo,
  config: SubmissionConfig,
  firmName: string = 'Précision DP'
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });

  const subtotal = lines.reduce((s, l) => s + l.price_total, 0);
  const bond = subtotal * config.bond_pct;
  const insurance = subtotal * config.insurance_pct;
  const contingency = subtotal * config.contingency_pct;
  const subtotalWithCont = subtotal + bond + insurance + contingency;
  const admin = subtotalWithCont * config.admin_pct;
  const profit = subtotalWithCont * config.profit_pct;
  const total = subtotalWithCont + admin + profit;

  const byDiv = groupByDivision(lines);
  const sortedDivisions = Object.keys(byDiv).sort();

  const currency = (n: number) => new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n);

  // ── PAGE 1: En-tête + Récap ─────────────────
  // Firm header
  doc.setFillColor(20, 184, 166); // accent teal
  doc.rect(0, 0, doc.internal.pageSize.width, 20, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(firmName, 15, 13);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('SOUMISSION BUDGÉTAIRE', doc.internal.pageSize.width - 15, 13, { align: 'right' });

  // Project info box
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  const infoY = 28;
  doc.setFont('helvetica', 'bold');
  doc.text(`Projet: ${project.name}`, 15, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(`No: ${project.number}`, 15, infoY + 5);
  doc.text(`Date: ${project.date}`, 15, infoY + 10);
  doc.text(`Estimateurs: ${project.estimators.join(', ')}`, 15, infoY + 15);

  if (project.surface_rough) {
    doc.text(`Surface brute: ${project.surface_rough.toLocaleString()} pi²`, 120, infoY);
    doc.text(`Surface nette: ${(project.surface_net ?? 0).toLocaleString()} pi²`, 120, infoY + 5);
    if (project.nb_units) doc.text(`Unités: ${project.nb_units}`, 120, infoY + 10);
  }

  // Recap table
  const recapData = sortedDivisions.map(div => {
    const tot = divTotal(byDiv[div]);
    const pct = total > 0 ? (tot / total * 100).toFixed(1) + '%' : '0%';
    const perSF = project.surface_rough ? (tot / project.surface_rough).toFixed(2) : '-';
    return [div, CSC_NAMES[div] ?? div, currency(tot), pct, `${perSF} $/pi²`];
  });

  recapData.push(
    ['', 'SOUS-TOTAL', currency(subtotal), '', ''],
    ['', `Cautions & Assurances`, currency(bond + insurance), '', ''],
    ['', `Contingences (${(config.contingency_pct * 100).toFixed(0)}%)`, currency(contingency), '', ''],
    ['', `Administration (${(config.admin_pct * 100).toFixed(0)}%)`, currency(admin), '', ''],
    ['', `Profit (${(config.profit_pct * 100).toFixed(0)}%)`, currency(profit), '', ''],
  );

  (doc as jsPDF & { autoTable: (opts: Record<string, unknown>) => void }).autoTable({
    startY: infoY + 22,
    head: [['Section', 'Description', 'Montant', '%', '$/pi²']],
    body: recapData,
    foot: [['', '** TOTAL SOUMISSION **', currency(total), '100%', project.surface_rough ? currency(total / project.surface_rough).replace('CA', '') + '/pi²' : '']],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [20, 27, 45], textColor: [226, 232, 240] },
    footStyles: { fillColor: [20, 184, 166], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 15 },
      2: { halign: 'right' },
      3: { halign: 'center' },
      4: { halign: 'right' },
    },
  });

  // ── PAGE PER DIVISION ────────────────────────
  sortedDivisions.forEach(div => {
    const divLines = byDiv[div];
    const divTotal_ = divTotal(divLines);

    doc.addPage();

    // Header
    doc.setFillColor(20, 27, 45);
    doc.rect(0, 0, doc.internal.pageSize.width, 14, 'F');
    doc.setTextColor(20, 184, 166);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Division ${div} — ${CSC_NAMES[div] ?? div}`, 10, 9);
    doc.setTextColor(226, 232, 240);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`${project.number} · ${project.name} · ${project.date}`, doc.internal.pageSize.width - 10, 9, { align: 'right' });

    const tableData = divLines.map(line => [
      line.description,
      line.quantity.toFixed(2),
      line.unit,
      line.price_material > 0 ? currency(line.price_material) : '-',
      currency(line.price_material * line.quantity),
      line.price_labor > 0 ? currency(line.price_labor) : '-',
      currency(line.price_labor * line.quantity),
      currency(line.price_total),
    ]);

    (doc as jsPDF & { autoTable: (opts: Record<string, unknown>) => void }).autoTable({
      startY: 18,
      head: [['Description', 'Qté', 'Unité', 'Mat. Unit.', 'Mat. Total', 'M-O Unit.', 'M-O Total', 'TOTAL']],
      body: tableData,
      foot: [[`TOTAL ${CSC_NAMES[div]?.toUpperCase() ?? div}`, '', '', '', '', '', '', currency(divTotal_)]],
      styles: { fontSize: 7.5, cellPadding: 1.5, overflow: 'linebreak' },
      headStyles: { fillColor: [20, 27, 45], textColor: [226, 232, 240], fontSize: 7 },
      footStyles: { fillColor: [20, 184, 166], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { halign: 'right', cellWidth: 16 },
        2: { halign: 'center', cellWidth: 14 },
        3: { halign: 'right', cellWidth: 22 },
        4: { halign: 'right', cellWidth: 22 },
        5: { halign: 'right', cellWidth: 22 },
        6: { halign: 'right', cellWidth: 22 },
        7: { halign: 'right', cellWidth: 24, fontStyle: 'bold' },
      },
    });
  });

  const filename = `${project.number}-${project.name.replace(/[^a-zA-Z0-9]/g, '_')}-Soumission.pdf`;
  doc.save(filename);
  toast.success(`PDF exporté: ${filename}`);
}

// ─────────────────────────────────────────────
// UI COMPONENT
// ─────────────────────────────────────────────
interface SubmissionExporterProps {
  lines?: EstimationLine[];
  project?: ProjectInfo;
  config?: SubmissionConfig;
}

const P = {
  bg: '#0c111d', surface: '#141b2d', surfaceAlt: '#1a2540',
  accent: '#14b8a6', accentAlt: '#f59e0b', text: '#e2e8f0', dim: '#64748b', border: '#1e293b',
};

export default function SubmissionExporter({ lines, project, config }: SubmissionExporterProps) {
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);

  const handleExcelExport = async () => {
    setExporting('excel');
    try {
      exportToExcel(lines, project, config);
    } catch (e) {
      toast.error('Erreur export Excel');
    } finally {
      setExporting(null);
    }
  };

  const handlePDFExport = async () => {
    setExporting('pdf');
    try {
      exportToPDF(lines, project, config);
    } catch (e) {
      toast.error('Erreur export PDF');
    } finally {
      setExporting(null);
    }
  };

  const subtotal = lines.reduce((s, l) => s + l.price_total, 0);
  const total = subtotal * (1 + config.contingency_pct + config.bond_pct + config.insurance_pct) * (1 + config.admin_pct + config.profit_pct);

  return (
    <div style={{
      background: P.surface, border: `1px solid ${P.border}`, borderRadius: 12, padding: 20,
    }}>
      <h3 style={{ margin: '0 0 16px', color: P.text, fontSize: 16, fontWeight: 700 }}>
        📄 Exporter la soumission
      </h3>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Travaux', value: subtotal },
          { label: '+ Charges', value: total - subtotal },
          { label: 'TOTAL', value: total },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: P.surfaceAlt, borderRadius: 8, padding: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: P.dim }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: P.accent }}>
              {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(value)}
            </div>
          </div>
        ))}
      </div>

      {/* Config */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Contingences', key: 'contingency_pct', value: config.contingency_pct },
          { label: 'Administration', key: 'admin_pct', value: config.admin_pct },
          { label: 'Profit', key: 'profit_pct', value: config.profit_pct },
        ].map(({ label, value }) => (
          <div key={label} style={{ fontSize: 11, color: P.dim }}>
            {label}: <strong style={{ color: P.text }}>{(value * 100).toFixed(0)}%</strong>
          </div>
        ))}
      </div>

      {/* Export buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleExcelExport}
          disabled={!!exporting || lines.length === 0}
          style={{
            flex: 1, padding: '12px', borderRadius: 8, border: 'none',
            background: '#22c55e', cursor: exporting ? 'not-allowed' : 'pointer',
            color: '#fff', fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            opacity: exporting ? 0.7 : 1,
          }}>
          {exporting === 'excel'
            ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
            : <FileSpreadsheet size={14} />}
          Excel (Template Précision DP)
        </button>
        <button
          onClick={handlePDFExport}
          disabled={!!exporting || lines.length === 0}
          style={{
            flex: 1, padding: '12px', borderRadius: 8, border: 'none',
            background: P.accentAlt, cursor: exporting ? 'not-allowed' : 'pointer',
            color: '#fff', fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            opacity: exporting ? 0.7 : 1,
          }}>
          {exporting === 'pdf'
            ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
            : <FileText size={14} />}
          PDF Soumission
        </button>
      </div>

      {lines.length === 0 && (
        <p style={{ textAlign: 'center', color: P.dim, fontSize: 12, margin: '12px 0 0' }}>
          Aucune ligne d'estimation — ajoutez des items dans la grille d'estimation
        </p>
      )}
    </div>
  );
}
