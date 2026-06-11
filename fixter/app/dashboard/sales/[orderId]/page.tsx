import { notFound, redirect } from 'next/navigation'
import { createAuthServerSupabase } from '@/lib/supabase-server-auth'
import { getOrderById } from '@/lib/orders-queries'
import { formatPrice } from '@/lib/format'
import SellerOrderView from '@/components/payments/seller-order-view'

export async function generateMetadata() {
  return { title: 'Mi venta — Fixter' }
}

export default async function SellerOrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params

  const supabase = await createAuthServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/dashboard/sales/${orderId}`)

  const order = await getOrderById(orderId)
  if (!order) notFound()
  if (order.seller_id !== user.id) notFound()

  return (
    <SellerOrderView
      order={{
        id: order.id,
        status: order.status,
        amount: order.amount,
        commission_amount: order.commission_amount,
        tracking_number: order.tracking_number,
        carrier: order.carrier,
      }}
      listing={{
        title: order.listing.title,
        image: order.listing.images?.[0] ?? null,
        price: order.listing.price,
      }}
      buyer={{ username: order.buyer.username }}
    />
  )
}
