/**
 * DAST Solutions - Layout Principal
 * Wrapper avec navigation pour les routes protégées
 */
import { Outlet } from 'react-router-dom'
import AppHeader from '@/components/AppHeader'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
