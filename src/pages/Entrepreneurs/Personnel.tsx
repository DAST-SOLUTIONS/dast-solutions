/**
 * DAST Solutions - Gestion Personnel CCQ
 * Gestion employés, taux horaires CCQ, compétences
 */
import { useState, useEffect, useMemo } from 'react'
import { PageTitle } from '@/components/PageTitle'
import { Search, Plus, Users, Phone, Mail, Calendar, DollarSign, Award, Clock, FileText, Edit, Trash2, X, Filter, Download, CheckCircle, AlertTriangle, Briefcase, Star, ChevronDown, Eye, Shield, HardHat } from 'lucide-react'
import { format, differenceInYears } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Employe {
  id: string; nom: string; prenom: string; nas?: string; dateNaissance: string; telephone: string; email: string
  adresse: { rue: string; ville: string; province: string; codePostal: string }
  metierCCQ: { code: string; nom: string; tauxHoraire: number; tauxVacances: number }
  competences: string[]; certifications: { nom: string; dateExpiration: string; status: 'valide' | 'expire' | 'bientot' }[]
  dateEmbauche: string; status: 'actif' | 'inactif' | 'conge'; heuresTravaillees: number; projetsAssignes: string[]
}

const METIERS_CCQ = [
  { code: '01', nom: 'Briqueteur-maçon', tauxHoraire: 45.50, tauxVacances: 13 },
  { code: '02', nom: 'Calorifugeur', tauxHoraire: 44.80, tauxVacances: 13 },
  { code: '03', nom: 'Carreleur', tauxHoraire: 43.20, tauxVacances: 13 },
  { code: '04', nom: 'Charpentier-menuisier', tauxHoraire: 44.00, tauxVacances: 13 },
  { code: '05', nom: 'Chaudronnier', tauxHoraire: 46.50, tauxVacances: 13 },
  { code: '06', nom: 'Cimentier-applicateur', tauxHoraire: 42.80, tauxVacances: 13 },
  { code: '07', nom: 'Couvreur', tauxHoraire: 43.50, tauxVacances: 13 },
  { code: '08', nom: 'Électricien', tauxHoraire: 47.20, tauxVacances: 13 },
  { code: '09', nom: 'Ferblantier', tauxHoraire: 45.00, tauxVacances: 13 },
  { code: '10', nom: 'Ferrailleur', tauxHoraire: 44.50, tauxVacances: 13 },
  { code: '11', nom: 'Frigoriste', tauxHoraire: 48.00, tauxVacances: 13 },
  { code: '12', nom: 'Grutier', tauxHoraire: 49.50, tauxVacances: 13 },
  { code: '13', nom: 'Mécanicien d\'ascenseur', tauxHoraire: 50.20, tauxVacances: 13 },
  { code: '14', nom: 'Mécanicien de machines lourdes', tauxHoraire: 47.80, tauxVacances: 13 },
  { code: '15', nom: 'Monteur-mécanicien (vitrier)', tauxHoraire: 44.20, tauxVacances: 13 },
  { code: '16', nom: 'Opérateur d\'équipement lourd', tauxHoraire: 46.00, tauxVacances: 13 },
  { code: '17', nom: 'Opérateur de pelles', tauxHoraire: 47.00, tauxVacances: 13 },
  { code: '18', nom: 'Peintre', tauxHoraire: 42.50, tauxVacances: 13 },
  { code: '19', nom: 'Plâtrier', tauxHoraire: 43.80, tauxVacances: 13 },
  { code: '20', nom: 'Poseur de systèmes intérieurs', tauxHoraire: 43.00, tauxVacances: 13 },
  { code: '21', nom: 'Soudeur', tauxHoraire: 46.80, tauxVacances: 13 },
  { code: '22', nom: 'Tuyauteur', tauxHoraire: 48.50, tauxVacances: 13 },
  { code: '23', nom: 'Manœuvre', tauxHoraire: 35.50, tauxVacances: 13 },
  { code: '24', nom: 'Arpenteur', tauxHoraire: 44.00, tauxVacances: 13 },
]

const CERTIFICATIONS = ['Santé et sécurité générale (ASP)', 'Travail en hauteur', 'SIMDUT 2015', 'Espace clos', 'Premiers soins', 'Chariot élévateur', 'Nacelle élévatrice', 'Signaleur', 'Cadenassage']

const DEMO_EMPLOYES: Employe[] = [
  { id: '1', nom: 'Tremblay', prenom: 'Jean-Pierre', dateNaissance: '1985-03-15', telephone: '514-555-0101', email: 'jp.tremblay@gmail.com', adresse: { rue: '123 Rue Principale', ville: 'Montréal', province: 'QC', codePostal: 'H1A 1A1' }, metierCCQ: METIERS_CCQ[3], competences: ['Lecture de plans', 'Coffrage', 'Finition'], certifications: [{ nom: 'ASP Construction', dateExpiration: '2025-06-15', status: 'valide' }, { nom: 'Travail en hauteur', dateExpiration: '2025-03-20', status: 'bientot' }], dateEmbauche: '2020-05-10', status: 'actif', heuresTravaillees: 1850, projetsAssignes: ['Centre sportif', 'École primaire'] },
  { id: '2', nom: 'Gagnon', prenom: 'Marie', dateNaissance: '1990-08-22', telephone: '514-555-0202', email: 'm.gagnon@outlook.com', adresse: { rue: '456 Boul. Saint-Laurent', ville: 'Laval', province: 'QC', codePostal: 'H7A 2B2' }, metierCCQ: METIERS_CCQ[7], competences: ['Câblage', 'Domotique', 'Panneaux électriques'], certifications: [{ nom: 'ASP Construction', dateExpiration: '2025-09-10', status: 'valide' }, { nom: 'SIMDUT 2015', dateExpiration: '2024-12-01', status: 'expire' }], dateEmbauche: '2019-03-01', status: 'actif', heuresTravaillees: 2200, projetsAssignes: ['Hôpital Maisonneuve'] },
  { id: '3', nom: 'Roy', prenom: 'Michel', dateNaissance: '1978-11-05', telephone: '450-555-0303', email: 'm.roy@videotron.ca', adresse: { rue: '789 Ave du Parc', ville: 'Longueuil', province: 'QC', codePostal: 'J4A 3C3' }, metierCCQ: METIERS_CCQ[0], competences: ['Maçonnerie traditionnelle', 'Restauration patrimoine', 'Pierre naturelle'], certifications: [{ nom: 'ASP Construction', dateExpiration: '2025-04-20', status: 'valide' }], dateEmbauche: '2015-08-15', status: 'actif', heuresTravaillees: 3500, projetsAssignes: ['Restauration église', 'Condos Vieux-Montréal'] },
  { id: '4', nom: 'Lavoie', prenom: 'Sophie', dateNaissance: '1995-02-18', telephone: '514-555-0404', email: 's.lavoie@gmail.com', adresse: { rue: '321 Rue Notre-Dame', ville: 'Montréal', province: 'QC', codePostal: 'H2Y 1C1' }, metierCCQ: METIERS_CCQ[17], competences: ['Peinture intérieure', 'Faux-finis', 'Application époxy'], certifications: [{ nom: 'ASP Construction', dateExpiration: '2025-07-30', status: 'valide' }, { nom: 'SIMDUT 2015', dateExpiration: '2025-05-15', status: 'valide' }], dateEmbauche: '2022-01-10', status: 'actif', heuresTravaillees: 950, projetsAssignes: ['Centre sportif'] },
  { id: '5', nom: 'Bouchard', prenom: 'Pierre', dateNaissance: '1982-07-30', telephone: '450-555-0505', email: 'p.bouchard@bell.ca', adresse: { rue: '555 Ch. du Lac', ville: 'Terrebonne', province: 'QC', codePostal: 'J6W 4D4' }, metierCCQ: METIERS_CCQ[16], competences: ['Excavation', 'Nivellement', 'Compactage'], certifications: [{ nom: 'ASP Construction', dateExpiration: '2025-02-28', status: 'bientot' }, { nom: 'Opérateur pelle', dateExpiration: '2026-01-15', status: 'valide' }], dateEmbauche: '2018-04-20', status: 'conge', heuresTravaillees: 2800, projetsAssignes: [] },
]

function CertBadge({ cert }: { cert: { nom: string; dateExpiration: string; status: 'valide' | 'expire' | 'bientot' } }) {
  const config = { valide: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle }, expire: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertTriangle }, bientot: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock } }[cert.status]
  return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${config.bg} ${config.text}`}><config.icon size={12} />{cert.nom}</span>
}

function StatusBadge({ status }: { status: 'actif' | 'inactif' | 'conge' }) {
  const config = { actif: { bg: 'bg-green-100', text: 'text-green-700', label: 'Actif' }, inactif: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Inactif' }, conge: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'En congé' } }[status]
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>{config.label}</span>
}

function EmployeCard({ employe, onView }: { employe: Employe; onView: (e: Employe) => void }) {
  const age = differenceInYears(new Date(), new Date(employe.dateNaissance))
  const anciennete = differenceInYears(new Date(), new Date(employe.dateEmbauche))
  const certExpirees = employe.certifications.filter(c => c.status === 'expire' || c.status === 'bientot').length
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-lg">{employe.prenom[0]}{employe.nom[0]}</div>
          <div><h3 className="font-semibold text-gray-900">{employe.prenom} {employe.nom}</h3><p className="text-sm text-gray-500">{employe.metierCCQ.nom}</p></div>
        </div>
        <StatusBadge status={employe.status} />
      </div>
      <div className="bg-teal-50 rounded-lg p-3 mb-4">
        <div className="flex justify-between items-center"><span className="text-sm text-teal-700">Taux horaire CCQ</span><span className="font-bold text-teal-800">{employe.metierCCQ.tauxHoraire.toFixed(2)}$/h</span></div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4 text-center text-sm">
        <div className="bg-gray-50 rounded p-2"><div className="font-semibold">{age} ans</div><div className="text-xs text-gray-500">Âge</div></div>
        <div className="bg-gray-50 rounded p-2"><div className="font-semibold">{anciennete} ans</div><div className="text-xs text-gray-500">Ancienneté</div></div>
        <div className="bg-gray-50 rounded p-2"><div className="font-semibold">{employe.heuresTravaillees}h</div><div className="text-xs text-gray-500">Heures</div></div>
      </div>
      {certExpirees > 0 && <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-4 flex items-center gap-2 text-sm text-amber-700"><AlertTriangle size={16} />{certExpirees} certification(s) à renouveler</div>}
      <div className="flex flex-wrap gap-1 mb-4">{employe.competences.slice(0, 2).map(c => <span key={c} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{c}</span>)}</div>
      <button onClick={() => onView(employe)} className="w-full px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center justify-center gap-2"><Eye size={16} />Voir profil</button>
    </div>
  )
}

function EmployeModal({ employe, isOpen, onClose }: { employe: Employe | null; isOpen: boolean; onClose: () => void }) {
  if (!isOpen || !employe) return null
  const anciennete = differenceInYears(new Date(), new Date(employe.dateEmbauche))
  const coutHoraire = employe.metierCCQ.tauxHoraire * (1 + employe.metierCCQ.tauxVacances / 100)
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">{employe.prenom[0]}{employe.nom[0]}</div>
              <div><h2 className="text-xl font-bold">{employe.prenom} {employe.nom}</h2><p className="text-teal-100">{employe.metierCCQ.nom} (Code {employe.metierCCQ.code})</p><StatusBadge status={employe.status} /></div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded"><X size={24} /></button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-teal-50 rounded-lg p-4 text-center"><DollarSign className="mx-auto text-teal-600 mb-1" size={24} /><div className="text-xl font-bold text-teal-800">{employe.metierCCQ.tauxHoraire.toFixed(2)}$</div><div className="text-xs text-teal-600">Taux horaire</div></div>
            <div className="bg-blue-50 rounded-lg p-4 text-center"><DollarSign className="mx-auto text-blue-600 mb-1" size={24} /><div className="text-xl font-bold text-blue-800">{coutHoraire.toFixed(2)}$</div><div className="text-xs text-blue-600">Coût total/h</div></div>
            <div className="bg-purple-50 rounded-lg p-4 text-center"><Clock className="mx-auto text-purple-600 mb-1" size={24} /><div className="text-xl font-bold text-purple-800">{employe.heuresTravaillees}</div><div className="text-xs text-purple-600">Heures travaillées</div></div>
            <div className="bg-amber-50 rounded-lg p-4 text-center"><Award className="mx-auto text-amber-600 mb-1" size={24} /><div className="text-xl font-bold text-amber-800">{anciennete} ans</div><div className="text-xs text-amber-600">Ancienneté</div></div>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-4"><h4 className="font-medium mb-3 flex items-center gap-2"><Phone size={16} />Contact</h4><div className="space-y-2 text-sm"><p>{employe.telephone}</p><p>{employe.email}</p></div></div>
            <div className="bg-gray-50 rounded-lg p-4"><h4 className="font-medium mb-3 flex items-center gap-2"><HardHat size={16} />Adresse</h4><div className="text-sm"><p>{employe.adresse.rue}</p><p>{employe.adresse.ville}, {employe.adresse.province} {employe.adresse.codePostal}</p></div></div>
          </div>
          <div className="mb-6"><h4 className="font-medium mb-3">Compétences</h4><div className="flex flex-wrap gap-2">{employe.competences.map(c => <span key={c} className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-sm">{c}</span>)}</div></div>
          <div className="mb-6"><h4 className="font-medium mb-3">Certifications</h4><div className="space-y-2">{employe.certifications.map((c, i) => <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3"><CertBadge cert={c} /><span className="text-sm text-gray-500">Exp: {format(new Date(c.dateExpiration), 'dd MMM yyyy', { locale: fr })}</span></div>)}</div></div>
          {employe.projetsAssignes.length > 0 && <div><h4 className="font-medium mb-3">Projets assignés</h4><div className="flex flex-wrap gap-2">{employe.projetsAssignes.map(p => <span key={p} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">{p}</span>)}</div></div>}
        </div>
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-100">Fermer</button>
          <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Modifier</button>
        </div>
      </div>
    </div>
  )
}

export default function PersonnelCCQ() {
  const [employes, setEmployes] = useState(DEMO_EMPLOYES)
  const [filtered, setFiltered] = useState(DEMO_EMPLOYES)
  const [search, setSearch] = useState('')
  const [metierFilter, setMetierFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'actif' | 'inactif' | 'conge'>('all')
  const [selected, setSelected] = useState<Employe | null>(null)

  useEffect(() => {
    let f = [...employes]
    if (search) f = f.filter(e => `${e.prenom} ${e.nom}`.toLowerCase().includes(search.toLowerCase()))
    if (metierFilter) f = f.filter(e => e.metierCCQ.code === metierFilter)
    if (statusFilter !== 'all') f = f.filter(e => e.status === statusFilter)
    setFiltered(f)
  }, [employes, search, metierFilter, statusFilter])

  const stats = useMemo(() => ({
    total: employes.length,
    actifs: employes.filter(e => e.status === 'actif').length,
    certExpire: employes.filter(e => e.certifications.some(c => c.status === 'expire')).length,
    heuresTotal: employes.reduce((s, e) => s + e.heuresTravaillees, 0),
    tauxMoyen: employes.reduce((s, e) => s + e.metierCCQ.tauxHoraire, 0) / employes.length
  }), [employes])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div><PageTitle title="Personnel CCQ" /><p className="text-gray-500 mt-1">Gestion des employés et taux horaires CCQ</p></div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Download size={18} />Exporter</button>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"><Plus size={18} />Nouvel employé</button>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 rounded-lg"><Users size={20} className="text-blue-600" /></div><div><div className="text-2xl font-bold">{stats.total}</div><div className="text-sm text-gray-500">Employés</div></div></div></div>
        <div className="bg-white rounded-xl border p-4"><div className="flex items-center gap-3"><div className="p-2 bg-green-100 rounded-lg"><CheckCircle size={20} className="text-green-600" /></div><div><div className="text-2xl font-bold">{stats.actifs}</div><div className="text-sm text-gray-500">Actifs</div></div></div></div>
        <div className="bg-white rounded-xl border p-4"><div className="flex items-center gap-3"><div className="p-2 bg-amber-100 rounded-lg"><AlertTriangle size={20} className="text-amber-600" /></div><div><div className="text-2xl font-bold">{stats.certExpire}</div><div className="text-sm text-gray-500">Cert. expirées</div></div></div></div>
        <div className="bg-white rounded-xl border p-4"><div className="flex items-center gap-3"><div className="p-2 bg-purple-100 rounded-lg"><Clock size={20} className="text-purple-600" /></div><div><div className="text-2xl font-bold">{(stats.heuresTotal/1000).toFixed(1)}k</div><div className="text-sm text-gray-500">Heures totales</div></div></div></div>
        <div className="bg-white rounded-xl border p-4"><div className="flex items-center gap-3"><div className="p-2 bg-teal-100 rounded-lg"><DollarSign size={20} className="text-teal-600" /></div><div><div className="text-2xl font-bold">{stats.tauxMoyen.toFixed(2)}$</div><div className="text-sm text-gray-500">Taux moyen</div></div></div></div>
      </div>
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Rechercher un employé..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" /></div>
          <select value={metierFilter} onChange={e => setMetierFilter(e.target.value)} className="px-4 py-2 border rounded-lg"><option value="">Tous les métiers</option>{METIERS_CCQ.map(m => <option key={m.code} value={m.code}>{m.nom}</option>)}</select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="px-4 py-2 border rounded-lg"><option value="all">Tous statuts</option><option value="actif">Actif</option><option value="inactif">Inactif</option><option value="conge">En congé</option></select>
        </div>
      </div>
      <p className="text-gray-600 mb-4"><span className="font-semibold">{filtered.length}</span> employé(s)</p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(e => <EmployeCard key={e.id} employe={e} onView={setSelected} />)}
      </div>
      <EmployeModal employe={selected} isOpen={!!selected} onClose={() => setSelected(null)} />
    </div>
  )
}
