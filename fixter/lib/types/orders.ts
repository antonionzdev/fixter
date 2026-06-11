export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'disputed'
  | 'refunded'
  | 'cancelled'

export type DisputeType =
  | 'not-received'
  | 'damaged'
  | 'wrong-item'
  | 'incorrect'
  | 'incomplete'
  | 'other'

export type DisputeStatus =
  | 'pending'
  | 'under_review'
  | 'resolved_buyer'
  | 'resolved_seller'
  | 'closed'

export interface OrderRow {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  amount: number
  commission_amount: number
  shipping_amount: number
  total_amount: number
  stripe_payment_intent_id: string
  status: OrderStatus
  tracking_number: string | null
  carrier: string | null
  delivered_at: string | null
  created_at: string
  updated_at: string
}

export interface DisputeRow {
  id: string
  order_id: string
  buyer_id: string
  dispute_type: DisputeType
  description: string
  evidence_urls: string[]
  status: DisputeStatus
  resolution_notes: string | null
  created_at: string
  updated_at: string
}

export interface OrderWithDetails extends OrderRow {
  listing: {
    id: string
    title: string
    images: string[]
    price: number
    status: string
  }
  buyer: {
    id: string
    username: string
    avatar_url: string | null
    full_name: string | null
  }
  seller: {
    id: string
    username: string
    avatar_url: string | null
    full_name: string | null
  }
  dispute: DisputeRow | null
}

export const CARRIERS = [
  'Correos',
  'Correos Express',
  'SEUR',
  'MRW',
  'DHL',
  'GLS',
] as const

export type Carrier = (typeof CARRIERS)[number]

export const DISPUTE_TYPES: { id: DisputeType; label: string; icon: string }[] = [
  { id: 'not-received', label: 'No he recibido el artículo', icon: 'truck' },
  { id: 'damaged', label: 'El artículo está dañado o defectuoso', icon: 'warn' },
  { id: 'wrong-item', label: 'El artículo no coincide con la descripción', icon: 'tag' },
  { id: 'incorrect', label: 'Me han enviado el artículo incorrecto', icon: 'alertCircle' },
  { id: 'incomplete', label: 'Falta contenido en el paquete', icon: 'box' },
  { id: 'other', label: 'Otro problema', icon: 'alertCircle' },
]

export const COMMISSION_RATE = 0.08
export const SHIPPING_ESTIMATE = 3.99

export function calcOrderAmounts(listingPrice: number) {
  const amount = listingPrice
  const commission_amount = parseFloat((amount * COMMISSION_RATE).toFixed(2))
  const shipping_amount = SHIPPING_ESTIMATE
  const total_amount = parseFloat((amount + commission_amount + shipping_amount).toFixed(2))
  return { amount, commission_amount, shipping_amount, total_amount }
}
