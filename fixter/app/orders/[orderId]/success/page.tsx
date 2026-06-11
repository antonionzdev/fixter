import { notFound, redirect } from 'next/navigation'
import { createAuthServerSupabase } from '@/lib/supabase-server-auth'
import { getOrderById } from '@/lib/orders-queries'
import { formatPrice } from '@/lib/format'
import Link from 'next/link'

export const metadata = { title: 'Pedido confirmado — Fixter' }

export default async function OrderSuccessPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params

  const supabase = await createAuthServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/orders/${orderId}/success`)

  const order = await getOrderById(orderId)
  if (!order) notFound()
  if (order.buyer_id !== user.id) notFound()

  const listing = order.listing
  const image = listing.images?.[0] ?? null
  const f = (n: number) => formatPrice(n)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 h-14 flex items-center justify-between">
          <span className="text-base font-bold text-zinc-950">Confirmación</span>
          <div className="hidden sm:flex items-center gap-2">
            {['Pedido', 'Pago', 'Confirmación'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && <div className="w-8 h-px bg-zinc-950" />}
                <div className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${i === 2 ? 'bg-[#FF6B2B] text-white' : 'bg-zinc-950 text-white'}`}>
                    {i < 2 ? (
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : i + 1}
                  </div>
                  <span className={`text-sm whitespace-nowrap ${i === 2 ? 'font-semibold text-zinc-950' : 'text-zinc-400 font-medium'}`}>{s}</span>
                </div>
              </div>
            ))}
          </div>
          <div />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-9">
          <div className="w-20 h-20 rounded-full bg-[#FF6B2B] flex items-center justify-center mx-auto mb-5">
            <svg width="36" height="28" viewBox="0 0 36 28" fill="none">
              <path d="M2 14L13 25L34 3" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 mb-2">¡Pago realizado!</h1>
          <p className="text-sm text-zinc-500 leading-relaxed">Tu pedido está confirmado. El importe queda retenido hasta que confirmes la recepción.</p>
        </div>

        {/* Order card */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 mb-4">
          {/* Product row */}
          <div className="flex gap-3.5 items-center pb-4 mb-4 border-b border-zinc-100">
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
            </div>
          </div>

          {/* Details */}
          {[
            ['Nº de pedido', `#FX-${order.id.slice(0, 6).toUpperCase()}`],
            ['Total pagado', f(order.total_amount)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between items-center py-2 border-b border-zinc-100 text-sm last:border-0">
              <span className="text-zinc-500">{k}</span>
              <span className="font-bold text-zinc-950">{v}</span>
            </div>
          ))}

          {/* Escrow notice */}
          <div className="mt-4 rounded-xl bg-[#FF6B2B]/10 p-3.5 flex gap-2.5 items-center">
            <svg className="w-4 h-4 text-[#FF6B2B] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span className="text-xs font-semibold text-[#7A3000] leading-snug">
              {f(order.amount)} retenidos en escrow hasta que confirmes la recepción
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href={`/orders/${orderId}/tracking`}
            className="block w-full py-4 bg-zinc-950 text-white text-base font-semibold text-center rounded-xl transition-[opacity,transform] duration-200 ease-out hover:opacity-90 active:scale-[0.97]"
          >
            Ver seguimiento del pedido
          </Link>
          <Link
            href="/"
            className="block w-full py-3.5 bg-white text-zinc-950 text-sm font-semibold text-center rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-colors duration-150"
          >
            Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  )
}
