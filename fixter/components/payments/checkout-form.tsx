'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { formatPrice } from '@/lib/format'

/* ── Icons ─────────────────────────────────────────────────────── */
function LockIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}
function ShieldIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  )
}
function BackIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  )
}

/* ── Stepper ────────────────────────────────────────────────────── */
function Stepper({ active }: { active: number }) {
  const steps = ['Pedido', 'Pago', 'Confirmación']
  return (
    <div className="hidden sm:flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          {i > 0 && (
            <div className={`w-8 h-px ${i <= active ? 'bg-zinc-950' : 'bg-zinc-200'}`} />
          )}
          <div className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
              i < active ? 'bg-zinc-950 text-white' :
              i === active ? 'bg-[#FF6B2B] text-white' :
              'bg-zinc-200 text-zinc-500'
            }`}>
              {i < active ? (
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : i + 1}
            </div>
            <span className={`text-sm whitespace-nowrap ${i === active ? 'font-semibold text-zinc-950' : 'text-zinc-400 font-medium'}`}>{s}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Inner form (needs Stripe context) ─────────────────────────── */
interface FormProps {
  listing: { id: string; title: string; image: string | null; price: number }
  seller: { username: string }
  amounts: { amount: number; commission_amount: number; shipping_amount: number; total_amount: number }
}

const ELEMENT_OPTIONS = {
  style: {
    base: {
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      fontSize: '14px',
      color: '#0F0F0F',
      '::placeholder': { color: '#9CA3AF' },
    },
    invalid: { color: '#DC2626' },
  },
}

function InnerCheckoutForm({ listing, seller, amounts }: FormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()

  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const f = (n: number) => formatPrice(n)

  const createPI = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        // If active order already exists, redirect to it
        if (data.orderId) { router.push(`/orders/${data.orderId}/tracking`); return }
        setError(data.error || 'No se pudo iniciar el pago')
        return
      }
      setClientSecret(data.clientSecret)
      setOrderId(data.orderId)
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }, [listing.id, router])

  useEffect(() => { createPI() }, [createPI])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements || !clientSecret || !orderId) return

    setSubmitting(true)
    setError(null)

    const cardNumber = elements.getElement(CardNumberElement)
    if (!cardNumber) { setSubmitting(false); return }

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardNumber },
    })

    if (stripeError) {
      setError(stripeError.message ?? 'Error al procesar el pago')
      setSubmitting(false)
      router.push(`/payment/failed?orderId=${orderId}`)
      return
    }

    if (paymentIntent?.status === 'requires_capture' || paymentIntent?.status === 'succeeded') {
      router.push(`/orders/${orderId}/success`)
    } else {
      setError('El pago no pudo completarse')
      setSubmitting(false)
    }
  }

  const fieldClass = (field: string) =>
    `w-full px-3.5 py-3 rounded-xl border text-sm transition-colors duration-150 bg-zinc-50 ${
      focusedField === field ? 'border-[#FF6B2B]' : 'border-zinc-200'
    }`

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 h-14 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-1 text-zinc-500 hover:text-zinc-900 transition-colors">
            <BackIcon />
          </button>
          <span className="text-base font-bold text-zinc-950">Pago seguro</span>
          <div className="flex-1 flex justify-center">
            <Stepper active={1} />
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold">
            <LockIcon className="w-3.5 h-3.5" /> SSL
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 lg:grid lg:grid-cols-[1fr_360px] lg:gap-7 lg:items-start">

        {/* Left: Card form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Product card */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-4 flex gap-3 items-center lg:hidden">
            <div className="w-14 h-14 rounded-xl bg-zinc-100 flex-shrink-0 overflow-hidden">
              {listing.image ? (
                <img src={listing.image} alt={listing.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="5" y="2" width="14" height="20" rx="2.5"/>
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-zinc-950 truncate">{listing.title}</div>
              <div className="text-xs text-zinc-400 mt-0.5">@{seller.username}</div>
            </div>
            <div className="text-base font-bold text-zinc-950">{f(listing.price)}</div>
          </div>

          {/* Card details */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            <h2 className="text-sm font-bold text-zinc-950 mb-5">Datos de la tarjeta</h2>

            {loading ? (
              <div className="space-y-3">
                {[80, 40, 40].map((w, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-zinc-100" style={{ width: `${w}%` }} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Número de tarjeta</label>
                  <div className={`relative ${fieldClass('card')}`} onFocus={() => setFocusedField('card')} onBlur={() => setFocusedField(null)}>
                    <CardNumberElement options={ELEMENT_OPTIONS} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Vencimiento</label>
                    <div className={fieldClass('exp')} onFocus={() => setFocusedField('exp')} onBlur={() => setFocusedField(null)}>
                      <CardExpiryElement options={ELEMENT_OPTIONS} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">CVV</label>
                    <div className={fieldClass('cvc')} onFocus={() => setFocusedField('cvc')} onBlur={() => setFocusedField(null)}>
                      <CardCvcElement options={ELEMENT_OPTIONS} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || submitting || !stripe || !clientSecret}
            className="w-full py-4 bg-zinc-950 text-white text-base font-semibold rounded-xl transition-[opacity,transform] duration-200 ease-out hover:opacity-90 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Procesando…' : `Pagar ${f(amounts.total_amount)}`}
          </button>

          <div className="flex items-center justify-center gap-5">
            {[['Cifrado SSL', LockIcon], ['Compra protegida', ShieldIcon]].map(([label, Icon]) => (
              <div key={label as string} className="flex items-center gap-1.5 text-xs text-zinc-400 font-semibold">
                {/* @ts-ignore */}
                <Icon className="w-3.5 h-3.5" />
                {label}
              </div>
            ))}
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-semibold">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              3D Secure
            </div>
          </div>
        </form>

        {/* Right: Order summary */}
        <div className="hidden lg:flex flex-col gap-4 mt-0">
          <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            <div className="flex gap-3.5 items-center pb-4 mb-4 border-b border-zinc-100">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex-shrink-0 overflow-hidden">
                {listing.image ? (
                  <img src={listing.image} alt={listing.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-7 h-7 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="5" y="2" width="14" height="20" rx="2.5"/>
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-zinc-950">{listing.title}</div>
                <div className="text-xs text-zinc-400 mt-1">@{seller.username}</div>
                <div className="text-base font-bold text-zinc-950 mt-1.5">{f(listing.price)}</div>
              </div>
            </div>

            <div className="text-sm font-bold text-zinc-950 mb-3">Resumen del pedido</div>

            {[
              { label: 'Precio artículo', value: f(amounts.amount), accent: false },
              { label: 'Comisión Fixter (8%)', value: f(amounts.commission_amount), accent: true },
              { label: 'Envío estimado', value: f(amounts.shipping_amount), accent: false },
            ].map(({ label, value, accent }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-zinc-100 text-sm">
                <span className="text-zinc-500">{label}</span>
                <span className={`font-medium ${accent ? 'font-bold text-[#FF6B2B]' : 'text-zinc-950'}`}>{value}</span>
              </div>
            ))}

            <div className="flex justify-between pt-3 mt-1">
              <span className="font-bold text-base text-zinc-950">Total</span>
              <span className="font-black text-xl text-zinc-950">{f(amounts.total_amount)}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-[#FF6B2B]/20 bg-[#FF6B2B]/[0.05] p-4 flex gap-3 items-start">
            <ShieldIcon className="w-4 h-4 text-[#FF6B2B] flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-zinc-950 mb-1">Compra protegida por Fixter</div>
              <p className="text-xs text-[#7A3000] leading-relaxed">El importe queda retenido en escrow hasta que confirmes la recepción del artículo.</p>
            </div>
          </div>
        </div>

        {/* Mobile: order summary below form */}
        <div className="lg:hidden mt-1 bg-white rounded-2xl border border-zinc-200 p-4">
          <div className="text-xs font-bold text-zinc-950 mb-3">Resumen del pedido</div>
          {[
            { label: 'Precio artículo', value: f(amounts.amount), accent: false },
            { label: 'Comisión Fixter (8%)', value: f(amounts.commission_amount), accent: true },
            { label: 'Envío estimado', value: f(amounts.shipping_amount), accent: false },
          ].map(({ label, value, accent }) => (
            <div key={label} className="flex justify-between items-center py-1.5 border-b border-zinc-100 text-sm">
              <span className="text-zinc-500">{label}</span>
              <span className={`font-medium ${accent ? 'font-bold text-[#FF6B2B]' : 'text-zinc-950'}`}>{value}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2.5 mt-1">
            <span className="font-bold text-sm text-zinc-950">Total</span>
            <span className="font-black text-base text-zinc-950">{f(amounts.total_amount)}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center gap-2">
            <LockIcon className="w-3 h-3 text-zinc-400" />
            <p className="text-[11px] text-zinc-400 leading-relaxed">Importe retenido hasta confirmar la recepción</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Public export — wraps with Stripe Elements ─────────────────── */
interface CheckoutFormProps extends FormProps {
  publishableKey: string
}

export default function CheckoutForm({ publishableKey, ...rest }: CheckoutFormProps) {
  const stripePromise = loadStripe(publishableKey)
  return (
    <Elements stripe={stripePromise}>
      <InnerCheckoutForm {...rest} />
    </Elements>
  )
}
