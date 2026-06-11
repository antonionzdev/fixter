import { notFound, redirect } from 'next/navigation'
import { createAuthServerSupabase } from '@/lib/supabase-server-auth'
import { getOrderById } from '@/lib/orders-queries'
import DisputeTypeSelector from '@/components/payments/dispute-type-selector'

export const metadata = { title: 'Abrir reclamación — Fixter' }

export default async function DisputeTypePage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params

  const supabase = await createAuthServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/orders/${orderId}/dispute/type`)

  const order = await getOrderById(orderId)
  if (!order) notFound()
  if (order.buyer_id !== user.id) notFound()

  if (!['paid', 'shipped', 'delivered'].includes(order.status)) {
    redirect(`/orders/${orderId}/tracking`)
  }

  if (order.dispute) {
    redirect(`/orders/${orderId}/dispute/sent`)
  }

  return <DisputeTypeSelector orderId={orderId} />
}
