import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/components/ToastProvider'

const plans = [
  { name: 'Gratuit', price: 0, description: 'Parfait pour commencer', features: ['5 takeoffs/mois', 'Support par email', 'Données stockées'], stripeId: null },
  { name: 'Pro', price: 29, description: 'Pour les professionnels', features: ['Takeoffs illimités','Jusqu\'à 10 projets','Export PDF','Support prioritaire','API accès'], stripeId: 'price_1234567890', popular: true },
  { name: 'Entreprise', price: 99, description: 'Pour les grandes équipes', features: ['Tout du Pro','Projets illimités','Utilisateurs illimités','Support 24/7','Training inclus','SLA garanti'], stripeId: 'price_0987654321' },
]

export function Pricing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSubscribe = async (priceId: string | null) => {
    if (!priceId) return
    if (!user) { navigate('/login'); return }

    setLoading(priceId)
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, userId: user.id, email: user.email }),
      })
      if (!response.ok) throw new Error('Failed to create checkout session')
      toast('Stripe sera activé bientôt!', 'info')
    } catch (error) {
      console.error('Error:', error)
      toast('Une erreur est survenue. Veuillez réessayer.', 'error')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Plans tarifaires simples</h1>
          <p className="text-xl text-gray-600">Choisissez le plan qui vous convient</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-lg shadow-lg overflow-hidden transition transform hover:scale-105 ${plan.popular ? 'ring-2 ring-teal-600 md:scale-105' : 'bg-white'} bg-white`}
            >
              {plan.popular && (
                <div className="bg-teal-600 text-white text-sm font-semibold px-4 py-2 text-center">
                  Populaire
                </div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-4 text-4xl font-extrabold text-gray-900">
                  {plan.price === 0 ? 'Gratuit' : `${plan.price}$`} <span className="text-sm font-medium text-gray-500">/mois</span>
                </div>
                <p className="mt-2 text-gray-600">{plan.description}</p>

                <ul className="mt-6 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-gray-700">
                      <Check size={18} className="text-teal-600" /> {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.stripeId)}
                  disabled={loading === plan.stripeId}
                  className="btn btn-primary w-full mt-6"
                >
                  {loading === plan.stripeId ? 'Traitement...' : 'Choisir ce plan'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Pricing
