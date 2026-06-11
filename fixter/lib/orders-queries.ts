import { createServerSupabase } from './supabase-server'
import { createAuthServerSupabase } from './supabase-server-auth'
import type { OrderWithDetails } from './types/orders'

// NOTE: no se seleccionan stripe_account_id / stripe_onboarding_complete de los
// perfiles. El cliente authenticated tiene REVOCADO el SELECT sobre esas
// columnas (PII / datos de pago) y ninguna vista las necesita; los flujos de
// Connect las leen vía service_role.
const ORDER_SELECT = `
  *,
  listing:listings(id, title, images, price, status),
  buyer:profiles!orders_buyer_id_fkey(id, username, avatar_url, full_name),
  seller:profiles!orders_seller_id_fkey(id, username, avatar_url, full_name),
  dispute:disputes(*)
`

export async function getOrderById(orderId: string): Promise<OrderWithDetails | null> {
  const supabase = await createAuthServerSupabase()
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('id', orderId)
    .maybeSingle()

  if (error || !data) return null
  return data as unknown as OrderWithDetails
}

export async function getOrderByPaymentIntent(
  paymentIntentId: string
): Promise<OrderWithDetails | null> {
  const supabase = createServerSupabase()
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('stripe_payment_intent_id', paymentIntentId)
    .maybeSingle()

  if (error || !data) return null
  return data as unknown as OrderWithDetails
}

export async function getBuyerOrders(): Promise<OrderWithDetails[]> {
  const supabase = await createAuthServerSupabase()
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data as unknown as OrderWithDetails[]
}
