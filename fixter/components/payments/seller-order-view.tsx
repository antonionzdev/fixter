'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from '@/lib/format'
import { CARRIERS } from '@/lib/types/orders'
import type { OrderStatus } from '@/lib/types/orders'

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pendiente de pago',
  paid: 'Pendiente de envío',
  shipped: 'Enviado',
  delivered: 'Entregado',
  completed: 'Completado',
  disputed: 'En reclamación',
  refunded: 'Reembolsado',
}

interface SellerOrderViewProps {
  order: {
    id: string
    status: OrderStatus
    amount: number
    commission_amount: number
    tracking_number: string | null
    carrier: string | null
  }
  listing: { title: string; image: string | null; price: number }
  buyer: { username: string }
}

export default function SellerOrderView({ order, listing, buyer }: SellerOrderViewProps) {
  const router = useRouter()
  const [tracking, setTracking] = useState(order.tracking_number ?? '')
  const [carrier, setCarrier] = useState(order.carrier ?? 'Correos Express')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(!!order.tracking_number)

  const payout = parseFloat((order.amount - order.commission_amount).toFixed(2))
  const statusLabel = STATUS_LABELS[order.status] ?? order.status
  const shippingStatus = sent ? 'Enviado' : 'Pendiente de envío'
  const shippingColor = sent ? '#059669' : '#FF6B2B'

  async function handleConfirmShipping() {
    if (tracking.trim().length < 5) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/add-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, trackingNumber: tracking.trim(), carrier }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al registrar el envío')
        setSubmitting(false)
        return
      }
      setSent(true)
      router.refresh()
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 h-14 flex items-center gap-3">
          <Link href="/dashboard" className="p-1 text-zinc-500 hover:text-zinc-900 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </Link>
          <span className="text-base font-bold text-zinc-950">Mi venta</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 flex flex-col gap-4">
        {/* Main grid on desktop */}
        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-5 lg:items-start flex flex-col gap-4">

          {/* Left: sale info + payment */}
          <div className="flex flex-col gap-4">
            {/* Sale item card */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-5">
              <div className="text-sm font-bold text-zinc-950 mb-4">Venta activa</div>

              <div className="flex gap-3.5 items-center pb-4 mb-4 border-b border-zinc-100">
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
                  <div className="text-xs text-zinc-400 mt-0.5">
                    Comprador: @{buyer.username} · Pedido #{order.id.slice(0, 6).toUpperCase()}
                  </div>
                  <div className="mt-2">
                    <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: shippingColor + '18', color: shippingColor }}>
                      {shippingStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment breakdown */}
              <div className="flex justify-between items-center py-2 border-b border-zinc-100 text-sm">
                <span className="text-zinc-500">Precio de venta</span>
                <span className="font-medium text-zinc-950">{formatPrice(order.amount)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-100 text-sm">
                <span className="text-zinc-500">Comisión Fixter (8%)</span>
                <span className="font-bold text-[#FF6B2B]">−{formatPrice(order.commission_amount)}</span>
              </div>
              <div className="flex justify-between pt-3 mt-1">
                <span className="font-bold text-base text-zinc-950">Recibirás</span>
                <span className="font-black text-xl text-zinc-950">{formatPrice(payout)}</span>
              </div>

              {/* Escrow status */}
              <div className="mt-4 rounded-xl bg-[#FF6B2B]/10 p-3.5 flex gap-2.5 items-center">
                <svg className="w-4 h-4 text-[#FF6B2B] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span className="text-xs font-semibold text-[#7A3000] leading-snug">
                  {sent
                    ? 'Esperando confirmación de recepción del comprador'
                    : 'Importe retenido hasta que el comprador confirme la recepción'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: tracking */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            {!sent ? (
              <>
                <div className="text-sm font-bold text-zinc-950 mb-1.5">Añadir número de seguimiento</div>
                <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
                  Una vez enviado el paquete, añade el número de seguimiento para que el comprador pueda rastrearlo.
                </p>

                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2.5">Transportista</div>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {CARRIERS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCarrier(c)}
                      className={`px-3 py-1.5 rounded-full border-[1.5px] text-xs font-semibold transition-all duration-150 ${
                        carrier === c
                          ? 'border-[#FF6B2B] bg-[#FF6B2B]/10 text-[#FF6B2B]'
                          : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2.5">Número de seguimiento</div>
                <input
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value.toUpperCase())}
                  placeholder="Ej. ES123456789MX"
                  className={`w-full px-3.5 py-3 rounded-xl border text-sm font-mono tracking-wider bg-zinc-50 transition-colors duration-150 focus:outline-none mb-4 ${
                    tracking.length > 0 ? 'border-[#FF6B2B]' : 'border-zinc-200'
                  }`}
                />

                {error && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                )}

                <button
                  onClick={handleConfirmShipping}
                  disabled={tracking.trim().length < 5 || submitting}
                  className="w-full py-4 bg-zinc-950 text-white text-base font-semibold rounded-xl transition-[opacity,transform] duration-200 ease-out hover:opacity-90 active:scale-[0.97] disabled:opacity-35 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Registrando…' : 'Confirmar envío'}
                </button>
              </>
            ) : (
              <>
                <div className="text-sm font-bold text-zinc-950 mb-4">Envío registrado</div>
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <div className="text-lg font-black font-mono tracking-widest text-zinc-950">{tracking}</div>
                    <div className="text-xs text-zinc-400 mt-1">{carrier}</div>
                  </div>
                  <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">Enviado</span>
                </div>

                {/* Mini timeline */}
                {[
                  { done: true, active: false, label: 'Número de tracking enviado al comprador' },
                  { done: false, active: true, label: 'Esperando confirmación de recepción' },
                  { done: false, active: false, label: 'Pago liberado en tu cuenta' },
                ].map((step, i, arr) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center w-5 flex-shrink-0">
                      <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center ${
                        step.done ? 'bg-zinc-950' : step.active ? 'bg-[#FF6B2B]' : 'bg-zinc-200'
                      }`}>
                        {step.done && (
                          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                        {step.active && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      {i < arr.length - 1 && (
                        <div className={`w-0.5 flex-1 min-h-4 my-0.5 ${step.done ? 'bg-zinc-950' : 'bg-zinc-200'}`} />
                      )}
                    </div>
                    <div className={`pb-4 ${i === arr.length - 1 ? 'pb-0' : ''}`}>
                      <span className={`text-sm font-${step.active ? '700' : '600'} ${
                        step.active ? 'text-[#FF6B2B]' : step.done ? 'text-zinc-950' : 'text-zinc-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
