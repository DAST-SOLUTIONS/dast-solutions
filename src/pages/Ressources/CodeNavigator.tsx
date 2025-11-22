import { PageTitle } from '@/components/PageTitle'

export function CodeNavigator() {
  return (
    <div>
      <PageTitle title="Code Navigator" subtitle="Navigateur du Code national du bâtiment 2020 et Code de construction du Québec" />
      <div className="bg-white p-8 rounded-lg shadow">
        <p className="text-gray-600">🚧 Page en construction...</p>
        <p className="text-sm text-gray-500 mt-2">Ici: Recherche et navigation du CND 2020 et CCQ</p>
      </div>
    </div>
  )
}