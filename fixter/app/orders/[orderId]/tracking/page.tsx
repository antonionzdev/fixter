import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createAuthServerSupabase } from '@/lib/supabase-server-auth'
import { getOrderById } from '@/lib/orders-queries'
import { formatPrice } from '@/lib/format'
import TrackingCopyButton from '@/components/payments/tracking-copy-button'

export async function generateMetadata({ params }: { params: Promise<{ orderId: string }> }) {
  return { title: 'Seguimiento del pedido — Fixter' }
}

const STATUS_STEPS: Record<string, number> = {
  pending_payment: 0,
  paid: 1,
  shipped: 3,
  delivered: 4,
  completed: 4,
  disputed: 3,
}

function getSteps(order: Awaited<ReturnType<typeof getOrderById>>) {
  if (!order) return []
  const current = STATUS_STEPS[order.status] ?? 1
  return [
    { label: 'Pedido confirmado', sub: 'Pago autorizado por Fixter', done: current >= 1, active: current === 1 },
    { label: 'Pago retenido en escrow', sub: 'Fixter protege tu compra', done: current >= 1, active: false },
    { label: 'En preparación', sub: 'El vendedor está preparando el envío', done: current >= 2, active: current === 2 },
    {
      label: 'En tránsito',
      sub: order.tracking_number ? `${order.tracking_number} · ${order.carrier}` : 'Esperando número de seguimiento',
      done: current >= 4,
      active: current === 3,
    },
    {
      label: 'Entregado',
      sub: order.status === 'completed' ? 'Pago liberado al vendedor' : 'Pendiente de recepción',
      done: current >= 4 && ['completed', 'delivered'].includes(order.status),
      active: current === 4 && order.status === 'delivered',
    },
  ]
}

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pendiente de pago',
  paid: 'Pagado',
  shipped: 'En tránsito',
  delivered: 'Entregado',
  completed: 'Completado',
  disputed: 'En reclamación',
  refunded: 'Reembolsado',
  cancelled: 'Cancelado',
}

export default async function OrderTrackingPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params

  const supabase = await createAuthServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/orders/${orderId}/tracking`)

  const order = await getOrderById(orderId)
  if (!order) notFound()
  if (order.buyer_id !== user.id && order.seller_id !== user.id) notFound()

  const isBuyer = order.buyer_id === user.id
  const listing = order.listing
  const image = listing.images?.[0] ?? null
  const steps = getSteps(order)
  const statusLabel = STATUS_LABELS[order.status] ?? order.status
  const canReceive = isBuyer && ['shipped', 'delivered'].includes(order.status)

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 h-14 flex items-center gap-3">
          <Link href={`/orders/${orderId}/success`} className="p-1 text-zinc-500 hover:text-zinc-900 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </Link>
          <span className="text-base font-bold text-zinc-950">Seguimiento del pedido</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 lg:grid lg:grid-cols-[1fr_300px] lg:gap-6 lg:items-start">

        {/* Main: timeline */}
        <div className="flex flex-col gap-4">
          {/* Product + status chip */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-4 flex gap-3.5 items-center">
            <div className="w-14 h-14 rounded-xl bg-zinc-100 flex-shrink-0 overflow-hidden">
              {image ? (
                <img src={image} alt={listing.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="5" y="2" width="14" height="20" rx="2.5"/>
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-zinc-400 mb-0.5">Pedido #{order.id.slice(0, 6).toUpperCase()}</div>
              <div className="text-sm font-bold text-zinc-950 truncate">{listing.title}</div>
              <div className="mt-1.5">
                <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FF6B2B]/10 text-[#FF6B2B]">
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Tracking number */}
          {order.tracking_number && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                Nº seguimiento (añadido por el vendedor)
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xl font-black font-mono tracking-widest text-zinc-950">{order.tracking_number}</div>
                  <div className="text-xs text-zinc-400 mt-1">{order.carrier}</div>
                </div>
                <TrackingCopyButton trackingNumber={order.tracking_number} />
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            <div className="text-sm font-bold text-zinc-950 mb-5">Estado del envío</div>
            <div className="space-y-0">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-3.5">
                  <div className="flex flex-col items-center w-5 flex-shrink-0">
                    <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center ${
                      step.done ? 'bg-zinc-950' :
                      step.active ? 'bg-[#FF6B2B]' :
                      'bg-zinc-200'
                    }`}>
                      {step.done && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                      {step.active && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`w-0.5 flex-1 min-h-5 my-0.5 ${step.done ? 'bg-zinc-950' : 'bg-zinc-200'}`} />
                    )}
                  </div>
                  <div className={`pb-4 ${i === steps.length - 1 ? 'pb-0' : ''} flex-1 min-w-0`}>
                    <div className={`text-sm font-${step.active ? '700' : '600'} ${
                      step.active ? 'text-[#FF6B2B]' :
                      step.done ? 'text-zinc-950' :
                      'text-zinc-400'
                    }`}>
                      {step.label}
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5 leading-snug">{step.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery estimate */}
          {['shipped', 'paid'].includes(order.status) && (
            <div className="rounded-xl bg-[#FF6B2B]/[0.08] px-4 py-3 flex gap-2.5 items-center">
              <svg className="w-4.5 h-4.5 text-[#FF6B2B] flex-shrink-0 w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="1"/>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              <span className="text-sm font-semibold text-[#7A3000]">Entrega estimada en 2–4 días hábiles</span>
            </div>
          )}

          {/* CTA */}
          {canReceive && (
            <Link
              href={`/orders/${orderId}/receive`}
              className="block w-full py-4 bg-zinc-950 text-white text-base font-semibold text-center rounded-xl transition-[opacity,transform] duration-200 ease-out hover:opacity-90 active:scale-[0.97]"
            >
              He recibido el pedido
            </Link>
          )}
        </div>

        {/* Right sidebar (desktop only) */}
        <div className="hidden lg:flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-zinc-200 p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-3">Artículo</div>
            <div className="flex gap-3 items-center">
              <div className="w-14 h-14 rounded-xl bg-zinc-100 flex-shrink-0 overflow-hidden">
                {image ? (
                  <img src={image} alt={listing.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="5" y="2" width="14" height="20" rx="2.5"/>
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <div className="text-sm font-bold text-zinc-950">{listing.title}</div>
                <div className="text-xs text-zinc-400 mt-0.5">@{order.seller.username}</div>
                <div className="text-sm font-bold text-zinc-950 mt-1">{formatPrice(order.amount)}</div>
              </div>
            </div>
            <div className="mt-3">
              <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FF6B2B]/10 text-[#FF6B2B]">
                {statusLabel}
              </span>
            </div>
          </div>

          {order.tracking_number && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2.5">Número de seguimiento</div>
              <div className="text-lg font-black font-mono tracking-widest text-zinc-950 mb-1">{order.tracking_number}</div>
              <div className="text-xs text-zinc-400 mb-3">{order.carrier}</div>
              <TrackingCopyButton trackingNumber={order.tracking_number} fullWidth />
            </div>
          )}

          {canReceive && (
            <Link
              href={`/orders/${orderId}/receive`}
              className="block w-full py-4 bg-zinc-950 text-white text-base font-semibold text-center rounded-xl transition-[opacity,transform] duration-200 ease-out hover:opacity-90 active:scale-[0.97]"
            >
              He recibido el pedido
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
