import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createAuthServerSupabase } from '@/lib/supabase-server-auth'
import { getOrderById } from '@/lib/orders-queries'

export const metadata = { title: 'Reclamación enviada — Fixter' }

export default async function DisputeSentPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params

  const supabase = await createAuthServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/orders/${orderId}/dispute/sent`)

  const order = await getOrderById(orderId)
  if (!order) notFound()
  if (order.buyer_id !== user.id) notFound()

  const dispute = order.dispute
  const recId = dispute?.id?.slice(0, 6).toUpperCase() ?? '------'
  const ordRef = order.id.slice(0, 6).toUpperCase()

  // Estimate response: 2 days from now
  const responseDate = new Date()
  responseDate.setDate(responseDate.getDate() + 2)
  const responseDateStr = responseDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 h-14 flex items-center">
          <span className="text-base font-bold text-zinc-950">Reclamación enviada</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-9">
          <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-5">
            <svg className="w-9 h-9 text-[#FF6B2B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 mb-2">Reclamación enviada</h1>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Nuestro equipo revisará tu caso y te contactará en menos de 48h. El pago permanece retenido hasta la resolución.
          </p>
        </div>

        {/* Details card */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 mb-5">
          {[
            ['Nº de reclamación', `#REC-${recId}`],
            ['Pedido', `#FX-${ordRef}`],
            ['Estado', 'En revisión por soporte'],
            ['Respuesta estimada', `Antes del ${responseDateStr}`],
          ].map(([k, v]) => (
            <div key={k} className={`flex justify-between items-center py-2.5 border-b border-zinc-100 text-sm last:border-0`}>
              <span className="text-zinc-500">{k}</span>
              <span className={`font-bold ${k === 'Estado' ? 'text-[#FF6B2B] text-xs' : 'text-zinc-950'}`}>{v}</span>
            </div>
          ))}
        </div>

        <Link
          href="/dashboard"
          className="block w-full py-4 bg-white text-zinc-950 text-base font-semibold text-center rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-colors duration-150"
        >
          Volver a mis pedidos
        </Link>
      </div>
    </div>
  )
}
