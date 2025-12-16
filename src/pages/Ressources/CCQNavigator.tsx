import { PageTitle } from '@/components/PageTitle'
import { useCCQRates } from '@/hooks/ccq/useCCQRates'
import { useState, useMemo } from 'react'
import { Search, Calculator, DollarSign, Users } from 'lucide-react'

export function CCQNavigator() {
  const { trades, sectors, loading, error, calculateEmployeeCost } = useCCQRates()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSector, setSelectedSector] = useState<string>('all')
  const [selectedTrade, setSelectedTrade] = useState<string>('')
  const [hours, setHours] = useState<string>('40')
  const [costResult, setCostResult] = useState<any>(null)
  const [calculating, setCalculating] = useState(false)

  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      const matchesSearch = trade.name_fr.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          trade.code.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })
  }, [trades, searchTerm])

  const handleCalculate = async () => {
    if (!selectedTrade || !selectedSector || selectedSector === 'all') {
      alert('Veuillez sélectionner un métier et un secteur')
      return
    }

    try {
      setCalculating(true)
      const result = await calculateEmployeeCost(selectedTrade, selectedSector, parseFloat(hours) || 40)
      setCostResult(result)
    } catch (err) {
      console.error('Error calculating cost:', err)
      alert('Erreur lors du calcul. Assurez-vous que les taux existent pour ce métier/secteur.')
    } finally {
      setCalculating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        Erreur: {error}
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageTitle title="CCQ Navigator" subtitle="Consultation des taux horaires et conventions collectives CCQ" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-teal-600" size={24} />
            <h3 className="font-semibold text-gray-700">Métiers</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{trades.length}</p>
          <p className="text-sm text-gray-500">métiers et occupations</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="text-teal-600" size={24} />
            <h3 className="font-semibold text-gray-700">Secteurs</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{sectors.length}</p>
          <p className="text-sm text-gray-500">secteurs de construction</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calculator className="text-teal-600" size={24} />
            <h3 className="font-semibold text-gray-700">Calculatrice</h3>
          </div>
          <p className="text-sm text-gray-600">Calculez le coût total incluant les cotisations</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Rechercher un métier</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="inline mr-2" size={16} />
              Rechercher
            </label>
            <input
              type="text"
              placeholder="Ex: Charpentier, ELEC, Plombier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Secteur</label>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="input-field"
            >
              <option value="all">Tous les secteurs</option>
              {sectors.map(sector => (
                <option key={sector.id} value={sector.code}>
                  {sector.name_fr}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Métiers disponibles ({filteredTrades.length})
          </h2>
        </div>

        {filteredTrades.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            Aucun métier trouvé. Essayez une autre recherche.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Code</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Métier</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Catégorie</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Licence</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map((trade) => (
                  <tr 
                    key={trade.id} 
                    className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedTrade(trade.code)}
                  >
                    <td className="px-6 py-3 text-sm font-mono font-semibold text-teal-600">
                      {trade.code}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900">{trade.name_fr}</td>
                    <td className="px-6 py-3 text-sm text-gray-600 capitalize">{trade.category}</td>
                    <td className="px-6 py-3 text-center">
                      {trade.requires_license ? (
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          Requise
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          Non requise
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Calculator size={24} className="text-teal-600" />
          Calculatrice de coût employé
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Métier</label>
            <select
              value={selectedTrade}
              onChange={(e) => setSelectedTrade(e.target.value)}
              className="input-field"
            >
              <option value="">Sélectionner un métier</option>
              {trades.map(trade => (
                <option key={trade.id} value={trade.code}>
                  {trade.code} - {trade.name_fr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Secteur</label>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="input-field"
            >
              <option value="all">Sélectionner un secteur</option>
              {sectors.map(sector => (
                <option key={sector.id} value={sector.code}>
                  {sector.name_fr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Heures</label>
            <input
              type="number"
              step="0.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="40"
              className="input-field"
            />
          </div>
        </div>

        <button
          onClick={handleCalculate}
          disabled={calculating || !selectedTrade || selectedSector === 'all'}
          className="btn btn-primary w-full mb-6"
        >
          {calculating ? 'Calcul en cours...' : 'Calculer le coût total'}
        </button>

        {costResult && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Résultats du calcul</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Salaire de base</p>
                <p className="text-2xl font-bold text-gray-900">
                  {costResult.base_salary?.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {costResult.hours_worked}h × {costResult.hourly_rate?.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}/h
                </p>
              </div>

              <div className="p-4 bg-teal-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Coût total</p>
                <p className="text-2xl font-bold text-teal-600">
                  {costResult.total_cost?.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                </p>
                <p className="text-xs text-gray-500 mt-1">incluant toutes les cotisations</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Détail des cotisations</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Fonds de vacances (13%)</span>
                  <span className="font-semibold">
                    {costResult.vacation?.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Jours fériés (5.5%)</span>
                  <span className="font-semibold">
                    {costResult.statutory_holidays?.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Assurance santé</span>
                  <span className="font-semibold">
                    {costResult.health_insurance?.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Régime de retraite</span>
                  <span className="font-semibold">
                    {costResult.pension?.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Formation professionnelle</span>
                  <span className="font-semibold">
                    {costResult.training_fund?.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                  </span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between">
                  <span className="text-gray-900 font-semibold">Total cotisations</span>
                  <span className="font-bold text-teal-600">
                    {costResult.social_benefits?.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CCQNavigator
