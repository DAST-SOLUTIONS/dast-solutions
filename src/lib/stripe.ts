import { loadStripe } from '@stripe/stripe-js'

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY

if (!stripePublicKey) {
  console.warn('Missing Stripe public key')
}

export const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null
