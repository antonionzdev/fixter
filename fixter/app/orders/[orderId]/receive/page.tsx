import { notFound, redirect } from 'next/navigation'
import { createAuthServerSupabase } from '@/lib/supabase-server-auth'
import { getOrderById } from '@/lib/orders-queries'
import ReceiveConfirmation from '@/components/payments/receive-confirmation'

export const metadata = { title: 'Confirmar recepción — Fixter' }

export default async function ReceivePage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params

  const supabase = await createAuthServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/orders/${orderId}/receive`)

  const order = await getOrderById(orderId)
  if (!order) notFound()
  if (order.buyer_id !== user.id) notFound()

  if (!['paid', 'shipped', 'delivered'].includes(order.status)) {
    redirect(`/orders/${orderId}/tracking`)
  }

  return (
    <ReceiveConfirmation
      orderId={orderId}
      listing={{
        title: order.listing.title,
        image: order.listing.images?.[0] ?? null,
        price: order.listing.price,
      }}
      seller={{ username: order.seller.username }}
      amount={order.amount}
    />
  )
}
