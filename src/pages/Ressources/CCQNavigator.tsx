import { PageTitle } from '@/components/PageTitle'

export function CCQNavigator() {
  return (
    <div>
      <PageTitle title="CCQ Navigator" subtitle="Navigateur des conventions collectives de la construction" />
      <div className="bg-white p-8 rounded-lg shadow">
        <p className="text-gray-600">🚧 Page en construction...</p>
        <p className="text-sm text-gray-500 mt-2">Ici: Recherche dans les conventions collectives</p>
      </div>
    </div>
  )
}