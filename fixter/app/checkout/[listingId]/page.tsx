import { redirect, notFound } from 'next/navigation'
import { createAuthServerSupabase } from '@/lib/supabase-server-auth'
import { createServerSupabase } from '@/lib/supabase-server'
import { formatPrice } from '@/lib/format'
import { calcOrderAmounts } from '@/lib/types/orders'
import CheckoutForm from '@/components/payments/checkout-form'

export async function generateMetadata({ params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params
  const supabase = createServerSupabase()
  const { data } = await supabase.from('listings').select('title').eq('id', listingId).maybeSingle()
  return { title: data?.title ? `Comprar ${data.title} — Fixter` : 'Checkout — Fixter' }
}

export default async function CheckoutPage({ params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params

  const supabase = await createAuthServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/checkout/${listingId}`)

  const supabasePublic = createServerSupabase()
  const { data: listing } = await supabasePublic
    .from('listings')
    .select(`
      id, title, price, status, images, seller_id,
      seller:profiles!listings_seller_id_fkey(id, username, avatar_url, full_name)
    `)
    .eq('id', listingId)
    .maybeSingle()

  if (!listing) notFound()
  if (listing.status !== 'active') redirect(`/listings/${listingId}`)
  if (listing.seller_id === user.id) redirect(`/listings/${listingId}`)

  const { amount, commission_amount, shipping_amount, total_amount } = calcOrderAmounts(listing.price)
  const seller = (listing.seller as unknown) as { id: string; username: string; avatar_url: string | null; full_name: string | null }

  return (
    <CheckoutForm
      listing={{
        id: listing.id,
        title: listing.title,
        image: listing.images?.[0] ?? null,
        price: listing.price,
      }}
      seller={{ username: seller?.username ?? '' }}
      amounts={{ amount, commission_amount, shipping_amount, total_amount }}
      publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''}
    />
  )
}
