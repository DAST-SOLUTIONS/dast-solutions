import { useState, useEffect } from 'react'
import { PageTitle } from '@/components/PageTitle'
import { useSoumissions } from '@/hooks/useSoumissions'
import { useProjects } from '@/hooks/useProjects'
import { useTakeoff } from '@/hooks/takeoff/useTakeoff'
import { useSoumissionPDF } from '@/hooks/useSoumissionPDF'
import { 
  Plus, FileText, Download, Send, Eye, Copy, Trash2, X, 
  Check, Building, User, MapPin, Phone, Mail, Calendar,
  DollarSign, AlertCircle, CheckCircle, Clock, XCircle, Loader2
} from 'lucide-react'
import type { 
  Soumission, 
  SoumissionStatus, 
  CreateSoumissionParams,
  SoumissionClient 
} from '@/types/soumission-types'
import { 
  SOUMISSION_STATUS_LABELS, 
  SOUMISSION_STATUS_COLORS,
  DEFAULT_CONDITIONS,
  DEFAULT_EXCLUSIONS,
  TAX_RATES,
  calculateSoumissionTotals
} from '@/types/soumission-types'

// Icônes de statut
const StatusIcon = ({ status }: { status: SoumissionStatus }) => {
  switch (status) {
    case 'brouillon': return <FileText size={14} />
    case 'envoyee': return <Send size={14} />
    case 'acceptee': return <CheckCircle size={14} />
    case 'refusee': return <XCircle size={14} />
    case 'expiree': return <Clock size={14} />
    default: return <AlertCircle size={14} />
  }
}

// Composant Badge de statut
const StatusBadge = ({ status }: { status: SoumissionStatus }) => (
  <span 
    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
    style={{ 
      backgroundColor: `${SOUMISSION_STATUS_COLORS[status]}20`,
      color: SOUMISSION_STATUS_COLORS[status]
    }}
  >
    <StatusIcon status={status} />
    {SOUMISSION_STATUS_LABELS[status]}
  </span>
)

// Modal de création de soumission
function CreateSoumissionModal({ 
  isOpen, 
  onClose, 
  onCreated 
}: { 
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const { projects } = useProjects()
  const { createSoumission } = useSoumissions()
  
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [takeoffItems, setTakeoffItems] = useState<any[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  
  // Données client
  const [client, setClient] = useState<SoumissionClient>({
    name: '',
    company: '',
    address: '',
    city: '',
    province: 'QC',
    postal_code: '',
    phone: '',
    email: ''
  })

  // Données projet
  const [projectInfo, setProjectInfo] = useState({
    name: '',
    address: '',
    description: ''
  })

  // Conditions
  const [conditions, setConditions] = useState(DEFAULT_CONDITIONS)
  const [exclusions, setExclusions] = useState(DEFAULT_EXCLUSIONS)
  const [validDays, setValidDays] = useState(30)

  // Charger les items du takeoff quand un projet est sélectionné
  useEffect(() => {
    const loadTakeoffItems = async () => {
      if (!selectedProjectId) {
        setTakeoffItems([])
        return
      }

      const project = projects.find(p => p.id === selectedProjectId)
      if (project) {
        setProjectInfo({
          name: project.name,
          address: project.address || '',
          description: project.description || ''
        })
      }

      // Charger les items via l'API Supabase directement
      const { supabase } = await import('@/lib/supabase')
      const { data } = await supabase
        .from('takeoff_items')
        .select('*')
        .eq('project_id', selectedProjectId)
        .order('created_at', { ascending: true })
      
      setTakeoffItems(data || [])
      setSelectedItems((data || []).map((item: any) => item.id))
    }

    loadTakeoffItems()
  }, [selectedProjectId, projects])

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const selectAllItems = () => {
    setSelectedItems(takeoffItems.map(item => item.id))
  }

  const deselectAllItems = () => {
    setSelectedItems([])
  }

  // Calculer les totaux des items sélectionnés
  const selectedItemsData = takeoffItems.filter(item => selectedItems.includes(item.id))
  const totals = calculateSoumissionTotals(
    selectedItemsData.map(item => ({
      quantity: item.quantity || 0,
      unit_price: item.unit_price || 0
    }))
  )

  const handleSubmit = async () => {
    if (!client.name) {
      alert('Le nom du client est requis')
      return
    }

    if (selectedItems.length === 0) {
      alert('Sélectionnez au moins un item')
      return
    }

    setLoading(true)
    try {
      const validUntil = new Date()
      validUntil.setDate(validUntil.getDate() + validDays)

      const params: CreateSoumissionParams = {
        project_id: selectedProjectId,
        client,
        project_name: projectInfo.name,
        project_address: projectInfo.address,
        project_description: projectInfo.description,
        items: selectedItemsData.map((item, index) => ({
          description: item.item_name,
          category: item.category,
          quantity: item.quantity || 0,
          unit: item.unit || 'unité',
          unit_price: item.unit_price || 0,
          total_price: (item.quantity || 0) * (item.unit_price || 0),
          sort_order: index,
          takeoff_item_id: item.id
        })),
        conditions,
        exclusions,
        date_valid_until: validUntil.toISOString()
      }

      const result = await createSoumission(params)
      if (result) {
        onCreated()
        onClose()
        resetForm()
      }
    } catch (err) {
      alert('Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setSelectedProjectId('')
    setTakeoffItems([])
    setSelectedItems([])
    setClient({
      name: '',
      company: '',
      address: '',
      city: '',
      province: 'QC',
      postal_code: '',
      phone: '',
      email: ''
    })
    setProjectInfo({ name: '', address: '', description: '' })
    setConditions(DEFAULT_CONDITIONS)
    setExclusions(DEFAULT_EXCLUSIONS)
    setValidDays(30)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Nouvelle Soumission</h2>
            <p className="text-teal-100 text-sm">Étape {step} de 3</p>
          </div>
          <button onClick={onClose} className="text-white hover:text-teal-200">
            <X size={24} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex bg-gray-100">
          {[1, 2, 3].map(s => (
            <div 
              key={s}
              className={`flex-1 h-1 ${s <= step ? 'bg-teal-600' : 'bg-gray-300'}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Étape 1: Sélection projet et items */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Projet source *
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="input-field"
                >
                  <option value="">-- Sélectionner un projet --</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>

              {takeoffItems.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Items à inclure ({selectedItems.length}/{takeoffItems.length})
                    </label>
                    <div className="space-x-2">
                      <button onClick={selectAllItems} className="text-sm text-teal-600 hover:underline">
                        Tout sélectionner
                      </button>
                      <button onClick={deselectAllItems} className="text-sm text-gray-500 hover:underline">
                        Tout désélectionner
                      </button>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                    {takeoffItems.map(item => (
                      <label 
                        key={item.id}
                        className={`flex items-center p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                          selectedItems.includes(item.id) ? 'bg-teal-50' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => toggleItemSelection(item.id)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.item_name}</p>
                          <p className="text-sm text-gray-500">{item.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{item.quantity} {item.unit}</p>
                          {item.total_price > 0 && (
                            <p className="text-sm text-green-600">
                              {item.total_price.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Résumé */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>Sous-total:</div>
                      <div className="text-right font-medium">{totals.subtotal.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</div>
                      <div>TPS (5%):</div>
                      <div className="text-right">{totals.tps_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</div>
                      <div>TVQ (9.975%):</div>
                      <div className="text-right">{totals.tvq_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</div>
                      <div className="font-bold text-lg">Total:</div>
                      <div className="text-right font-bold text-lg text-teal-600">{totals.total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</div>
                    </div>
                  </div>
                </div>
              )}

              {selectedProjectId && takeoffItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Aucun item dans le takeoff de ce projet</p>
                  <p className="text-sm">Ajoutez des items dans l'estimation d'abord</p>
                </div>
              )}
            </div>
          )}

          {/* Étape 2: Informations client */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <User size={20} />
                Informations du client
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du client *
                  </label>
                  <input
                    type="text"
                    value={client.name}
                    onChange={(e) => setClient({...client, name: e.target.value})}
                    placeholder="Ex: Jean Tremblay"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entreprise
                  </label>
                  <input
                    type="text"
                    value={client.company}
                    onChange={(e) => setClient({...client, company: e.target.value})}
                    placeholder="Ex: Construction ABC Inc."
                    className="input-field"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={client.address}
                    onChange={(e) => setClient({...client, address: e.target.value})}
                    placeholder="Ex: 123 Rue Principale"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={client.city}
                    onChange={(e) => setClient({...client, city: e.target.value})}
                    placeholder="Ex: Montréal"
                    className="input-field"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Province
                    </label>
                    <select
                      value={client.province}
                      onChange={(e) => setClient({...client, province: e.target.value})}
                      className="input-field"
                    >
                      <option value="QC">Québec</option>
                      <option value="ON">Ontario</option>
                      <option value="NB">Nouveau-Brunswick</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code postal
                    </label>
                    <input
                      type="text"
                      value={client.postal_code}
                      onChange={(e) => setClient({...client, postal_code: e.target.value.toUpperCase()})}
                      placeholder="H2X 1Y4"
                      maxLength={7}
                      className="input-field"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={client.phone}
                    onChange={(e) => setClient({...client, phone: e.target.value})}
                    placeholder="514-555-1234"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Courriel
                  </label>
                  <input
                    type="email"
                    value={client.email}
                    onChange={(e) => setClient({...client, email: e.target.value})}
                    placeholder="client@exemple.com"
                    className="input-field"
                  />
                </div>
              </div>

              <hr />

              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Building size={20} />
                Informations du projet
              </h3>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du projet
                  </label>
                  <input
                    type="text"
                    value={projectInfo.name}
                    onChange={(e) => setProjectInfo({...projectInfo, name: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse du projet
                  </label>
                  <input
                    type="text"
                    value={projectInfo.address}
                    onChange={(e) => setProjectInfo({...projectInfo, address: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={projectInfo.description}
                    onChange={(e) => setProjectInfo({...projectInfo, description: e.target.value})}
                    rows={2}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Étape 3: Conditions et finalisation */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Validité de la soumission
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={validDays}
                    onChange={(e) => setValidDays(parseInt(e.target.value) || 30)}
                    min={1}
                    max={365}
                    className="input-field w-24"
                  />
                  <span className="text-gray-600">jours</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conditions générales
                </label>
                <textarea
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  rows={8}
                  className="input-field font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exclusions
                </label>
                <textarea
                  value={exclusions}
                  onChange={(e) => setExclusions(e.target.value)}
                  rows={6}
                  className="input-field font-mono text-sm"
                />
              </div>

              {/* Résumé final */}
              <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                <h4 className="font-bold text-teal-800 mb-3">Résumé de la soumission</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">Client:</div>
                  <div className="font-medium">{client.name || '-'}</div>
                  <div className="text-gray-600">Projet:</div>
                  <div className="font-medium">{projectInfo.name || '-'}</div>
                  <div className="text-gray-600">Items:</div>
                  <div className="font-medium">{selectedItems.length}</div>
                  <div className="text-gray-600 font-bold">Total:</div>
                  <div className="font-bold text-teal-700">{totals.total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="btn btn-secondary"
          >
            {step > 1 ? 'Précédent' : 'Annuler'}
          </button>
          
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && selectedItems.length === 0}
              className="btn btn-primary"
            >
              Suivant
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !client.name}
              className="btn btn-primary"
            >
              {loading ? 'Création...' : 'Créer la soumission'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Modal de visualisation
function ViewSoumissionModal({
  soumission,
  onClose,
  onStatusChange,
  onDuplicate,
  onDelete
}: {
  soumission: Soumission | null
  onClose: () => void
  onStatusChange: (id: string, status: SoumissionStatus) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
}) {
  if (!soumission) return null

  // Hook PDF professionnel
  const { downloadSoumissionPDF, previewSoumissionPDF, generating } = useSoumissionPDF()

  const handleDownloadPDF = async () => {
    await downloadSoumissionPDF(soumission.id)
  }

  const handlePreviewPDF = async () => {
    await previewSoumissionPDF(soumission.id)
  }

  // Ancienne méthode conservée en backup
  const generatePDFLegacy = () => {
    // Créer le contenu HTML pour impression
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Soumission ${soumission.soumission_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { border-bottom: 2px solid #0d9488; padding-bottom: 20px; margin-bottom: 20px; }
          .company { font-size: 24px; font-weight: bold; color: #0d9488; }
          .soumission-number { font-size: 18px; color: #666; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: bold; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background: #f5f5f5; }
          .total-row { font-weight: bold; background: #f0fdfa; }
          .grand-total { font-size: 18px; color: #0d9488; }
          .conditions { background: #f9f9f9; padding: 15px; border-radius: 5px; font-size: 12px; white-space: pre-wrap; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company">DAST Solutions</div>
          <div class="soumission-number">Soumission #${soumission.soumission_number}</div>
          <div>Date: ${new Date(soumission.date_created).toLocaleDateString('fr-CA')}</div>
          <div>Valide jusqu'au: ${soumission.date_valid_until ? new Date(soumission.date_valid_until).toLocaleDateString('fr-CA') : '-'}</div>
        </div>

        <div class="grid">
          <div class="section">
            <div class="section-title">Client</div>
            <div><strong>${soumission.client_name}</strong></div>
            ${soumission.client_company ? `<div>${soumission.client_company}</div>` : ''}
            ${soumission.client_address ? `<div>${soumission.client_address}</div>` : ''}
            ${soumission.client_city ? `<div>${soumission.client_city}, ${soumission.client_province} ${soumission.client_postal_code}</div>` : ''}
            ${soumission.client_phone ? `<div>Tél: ${soumission.client_phone}</div>` : ''}
            ${soumission.client_email ? `<div>Courriel: ${soumission.client_email}</div>` : ''}
          </div>
          <div class="section">
            <div class="section-title">Projet</div>
            <div><strong>${soumission.project_name || '-'}</strong></div>
            ${soumission.project_address ? `<div>${soumission.project_address}</div>` : ''}
            ${soumission.project_description ? `<div>${soumission.project_description}</div>` : ''}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Détail des travaux</div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantité</th>
                <th>Prix unitaire</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${(soumission.items || []).map(item => `
                <tr>
                  <td>${item.description}${item.category ? `<br><small style="color:#666">${item.category}</small>` : ''}</td>
                  <td>${item.quantity} ${item.unit}</td>
                  <td>${item.unit_price.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</td>
                  <td>${item.total_price.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3" style="text-align:right">Sous-total:</td>
                <td>${soumission.subtotal.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</td>
              </tr>
              <tr>
                <td colspan="3" style="text-align:right">TPS (5%):</td>
                <td>${soumission.tps_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</td>
              </tr>
              <tr>
                <td colspan="3" style="text-align:right">TVQ (9.975%):</td>
                <td>${soumission.tvq_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</td>
              </tr>
              <tr class="total-row grand-total">
                <td colspan="3" style="text-align:right">TOTAL:</td>
                <td>${soumission.total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</td>
              </tr>
            </tbody>
          </table>
        </div>

        ${soumission.conditions ? `
        <div class="section">
          <div class="section-title">Conditions</div>
          <div class="conditions">${soumission.conditions}</div>
        </div>
        ` : ''}

        ${soumission.exclusions ? `
        <div class="section">
          <div class="section-title">Exclusions</div>
          <div class="conditions">${soumission.exclusions}</div>
        </div>
        ` : ''}

        <div class="footer">
          <p>DAST Solutions - Construction Management Platform</p>
          <p>Cette soumission est valide pour 30 jours à compter de la date d'émission.</p>
        </div>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Soumission #{soumission.soumission_number}
            </h2>
            <StatusBadge status={soumission.status} />
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Info client et projet */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                <User size={16} /> Client
              </h3>
              <p className="font-medium">{soumission.client_name}</p>
              {soumission.client_company && <p className="text-gray-600">{soumission.client_company}</p>}
              {soumission.client_address && <p className="text-gray-600">{soumission.client_address}</p>}
              {soumission.client_city && (
                <p className="text-gray-600">
                  {soumission.client_city}, {soumission.client_province} {soumission.client_postal_code}
                </p>
              )}
              {soumission.client_phone && (
                <p className="text-gray-600 flex items-center gap-1">
                  <Phone size={12} /> {soumission.client_phone}
                </p>
              )}
              {soumission.client_email && (
                <p className="text-gray-600 flex items-center gap-1">
                  <Mail size={12} /> {soumission.client_email}
                </p>
              )}
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Building size={16} /> Projet
              </h3>
              <p className="font-medium">{soumission.project_name || '-'}</p>
              {soumission.project_address && (
                <p className="text-gray-600 flex items-center gap-1">
                  <MapPin size={12} /> {soumission.project_address}
                </p>
              )}
              {soumission.project_description && (
                <p className="text-gray-600 mt-2">{soumission.project_description}</p>
              )}
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar size={12} /> Créée le {new Date(soumission.date_created).toLocaleDateString('fr-CA')}
                </p>
                {soumission.date_valid_until && (
                  <p className="text-sm text-gray-500">
                    Valide jusqu'au {new Date(soumission.date_valid_until).toLocaleDateString('fr-CA')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-700 mb-3">Détail des travaux</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Quantité</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Prix unit.</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(soumission.items || []).map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{item.description}</p>
                        {item.category && <p className="text-xs text-gray-500">{item.category}</p>}
                      </td>
                      <td className="px-4 py-3 text-right">{item.quantity} {item.unit}</td>
                      <td className="px-4 py-3 text-right">{item.unit_price.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</td>
                      <td className="px-4 py-3 text-right font-medium">{item.total_price.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100">
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right font-medium">Sous-total:</td>
                    <td className="px-4 py-2 text-right font-medium">{soumission.subtotal.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right text-sm">TPS (5%):</td>
                    <td className="px-4 py-2 text-right">{soumission.tps_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right text-sm">TVQ (9.975%):</td>
                    <td className="px-4 py-2 text-right">{soumission.tvq_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</td>
                  </tr>
                  <tr className="bg-teal-50">
                    <td colSpan={3} className="px-4 py-3 text-right font-bold text-lg">TOTAL:</td>
                    <td className="px-4 py-3 text-right font-bold text-lg text-teal-700">{soumission.total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Conditions */}
          {soumission.conditions && (
            <div className="mb-6">
              <h3 className="font-bold text-gray-700 mb-2">Conditions</h3>
              <pre className="p-4 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap font-sans">{soumission.conditions}</pre>
            </div>
          )}

          {soumission.exclusions && (
            <div className="mb-6">
              <h3 className="font-bold text-gray-700 mb-2">Exclusions</h3>
              <pre className="p-4 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap font-sans">{soumission.exclusions}</pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
          <div className="flex gap-2">
            {soumission.status === 'brouillon' && (
              <button
                onClick={() => onStatusChange(soumission.id, 'envoyee')}
                className="btn bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send size={16} className="mr-2" /> Marquer envoyée
              </button>
            )}
            {soumission.status === 'envoyee' && (
              <>
                <button
                  onClick={() => onStatusChange(soumission.id, 'acceptee')}
                  className="btn bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check size={16} className="mr-2" /> Acceptée
                </button>
                <button
                  onClick={() => onStatusChange(soumission.id, 'refusee')}
                  className="btn bg-red-600 hover:bg-red-700 text-white"
                >
                  <X size={16} className="mr-2" /> Refusée
                </button>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePreviewPDF}
              disabled={generating}
              className="btn btn-secondary"
            >
              <Eye size={16} className="mr-2" /> 
              {generating ? 'Génération...' : 'Aperçu'}
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={generating}
              className="btn bg-teal-600 hover:bg-teal-700 text-white"
            >
              <Download size={16} className="mr-2" /> PDF
            </button>
            <button
              onClick={() => onDuplicate(soumission.id)}
              className="btn btn-secondary"
            >
              <Copy size={16} className="mr-2" /> Dupliquer
            </button>
            <button
              onClick={() => {
                if (confirm('Supprimer cette soumission?')) {
                  onDelete(soumission.id)
                }
              }}
              className="btn bg-red-100 text-red-700 hover:bg-red-200"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Page principale
export default function SoumissionsPage() {
  const { soumissions, loading, getSoumission, updateStatus, deleteSoumission, duplicateSoumission, refetch } = useSoumissions()
  const [showCreate, setShowCreate] = useState(false)
  const [viewingSoumission, setViewingSoumission] = useState<Soumission | null>(null)
  const [loadingView, setLoadingView] = useState(false)

  const handleView = async (id: string) => {
    setLoadingView(true)
    const soumission = await getSoumission(id)
    setViewingSoumission(soumission)
    setLoadingView(false)
  }

  const handleStatusChange = async (id: string, status: SoumissionStatus) => {
    await updateStatus(id, status)
    if (viewingSoumission?.id === id) {
      const updated = await getSoumission(id)
      setViewingSoumission(updated)
    }
  }

  const handleDuplicate = async (id: string) => {
    const result = await duplicateSoumission(id)
    if (result) {
      setViewingSoumission(null)
      alert('Soumission dupliquée avec succès!')
    }
  }

  const handleDelete = async (id: string) => {
    const success = await deleteSoumission(id)
    if (success) {
      setViewingSoumission(null)
    }
  }

  return (
    <div className="animate-fade-in">
      <PageTitle 
        title="Soumissions" 
        subtitle="Gérez vos devis et soumissions de construction" 
      />

      {/* Header avec bouton créer */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">{soumissions.length}</span> soumission(s)
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn btn-primary"
        >
          <Plus size={16} className="mr-2" />
          Nouvelle soumission
        </button>
      </div>

      {/* Liste des soumissions */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="spinner" />
        </div>
      ) : soumissions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText size={64} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune soumission</h3>
          <p className="text-gray-600 mb-6">Créez votre première soumission à partir d'un projet existant.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="btn btn-primary"
          >
            <Plus size={16} className="mr-2" />
            Créer une soumission
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {soumissions.map(soumission => (
                <tr key={soumission.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-mono font-medium text-teal-600">{soumission.soumission_number}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{soumission.client_name}</p>
                    {soumission.client_company && (
                      <p className="text-sm text-gray-500">{soumission.client_company}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {soumission.project_name || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900">
                      {soumission.total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={soumission.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(soumission.date_created).toLocaleDateString('fr-CA')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleView(soumission.id)}
                      className="text-teal-600 hover:text-teal-800"
                      disabled={loadingView}
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <CreateSoumissionModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={refetch}
      />

      <ViewSoumissionModal
        soumission={viewingSoumission}
        onClose={() => setViewingSoumission(null)}
        onStatusChange={handleStatusChange}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
      />
    </div>
  )
}