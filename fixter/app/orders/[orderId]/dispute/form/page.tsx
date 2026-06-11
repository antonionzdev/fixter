import { notFound, redirect } from 'next/navigation'
import { createAuthServerSupabase } from '@/lib/supabase-server-auth'
import { getOrderById } from '@/lib/orders-queries'
import DisputeForm from '@/components/payments/dispute-form'
import { DISPUTE_TYPES } from '@/lib/types/orders'
import type { DisputeType } from '@/lib/types/orders'

export const metadata = { title: 'Describe el problema — Fixter' }

export default async function DisputeFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>
  searchParams: Promise<{ type?: string }>
}) {
  const [{ orderId }, sp] = await Promise.all([params, searchParams])
  const disputeType = sp.type as DisputeType | undefined

  const validTypes = DISPUTE_TYPES.map((t) => t.id)
  if (!disputeType || !validTypes.includes(disputeType)) {
    redirect(`/orders/${orderId}/dispute/type`)
  }

  const supabase = await createAuthServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/orders/${orderId}/dispute/form?type=${disputeType}`)

  const order = await getOrderById(orderId)
  if (!order) notFound()
  if (order.buyer_id !== user.id) notFound()

  if (order.dispute) redirect(`/orders/${orderId}/dispute/sent`)

  const typeLabel = DISPUTE_TYPES.find((t) => t.id === disputeType)?.label ?? ''

  return (
    <DisputeForm
      orderId={orderId}
      disputeType={disputeType}
      typeLabel={typeLabel}
      listing={{
        title: order.listing.title,
        image: order.listing.images?.[0] ?? null,
        price: order.listing.price,
      }}
    />
  )
}
