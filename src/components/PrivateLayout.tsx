import AppHeader from "@/components/AppHeader"

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
