import { NextRequest, NextResponse } from 'next/server'
import { createAuthServerSupabase } from '@/lib/supabase-server-auth'
import { createServiceSupabase } from '@/lib/supabase-service'
import { getStripe } from '@/lib/stripe'
import { calcOrderAmounts } from '@/lib/types/orders'

export async function POST(req: NextRequest) {
  try {
    const supabaseAuth = await createAuthServerSupabase()
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { listingId } = await req.json()
    if (!listingId || typeof listingId !== 'string') {
      return NextResponse.json({ error: 'listingId requerido' }, { status: 400 })
    }

    // Fetch listing and seller data — validate server-side, never trust client amounts
    const supabaseService = createServiceSupabase()
    const { data: listing, error: listingError } = await supabaseService
      .from('listings')
      .select('id, title, price, status, seller_id, seller:profiles!listings_seller_id_fkey(id, username, stripe_account_id, stripe_onboarding_complete)')
      .eq('id', listingId)
      .maybeSingle()

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Anuncio no encontrado' }, { status: 404 })
    }
    if (listing.status !== 'active') {
      return NextResponse.json({ error: 'Este artículo ya no está disponible' }, { status: 409 })
    }
    if (listing.seller_id === user.id) {
      return NextResponse.json({ error: 'No puedes comprar tu propio artículo' }, { status: 403 })
    }

    // Purchase exclusivity: at most one "live" order may exist per listing.
    // A live order is any order that holds funds or commits the item. This is
    // also enforced at the DB level by the partial unique index
    // `orders_one_active_per_listing` (see security-fixes-2026-06-04.sql), which
    // is the source of truth and closes the TOCTOU race below.
    const LIVE_STATUSES = ['pending_payment', 'paid', 'shipped', 'delivered', 'completed', 'disputed']
    const { data: existingOrder } = await supabaseService
      .from('orders')
      .select('id, status, buyer_id')
      .eq('listing_id', listingId)
      .in('status', LIVE_STATUSES)
      .maybeSingle()

    if (existingOrder) {
      // The same buyer can resume their own in-progress order.
      if (existingOrder.buyer_id === user.id) {
        return NextResponse.json(
          { error: 'Ya tienes un pedido activo para este artículo', orderId: existingOrder.id },
          { status: 409 },
        )
      }
      // A different buyer already has a live order on this listing → blocked.
      return NextResponse.json(
        { error: 'Otro comprador ya tiene una compra en curso para este artículo' },
        { status: 409 },
      )
    }

    const { amount, commission_amount, shipping_amount, total_amount } = calcOrderAmounts(listing.price)
    const totalCents = Math.round(total_amount * 100)
    const feeCents = Math.round(commission_amount * 100)

    const stripe = getStripe()

    // Build PaymentIntent params — add Connect transfer only if seller is onboarded
    const seller = (listing.seller as unknown) as { id: string; username: string; stripe_account_id: string | null; stripe_onboarding_complete: boolean } | null
    const piParams: Parameters<typeof stripe.paymentIntents.create>[0] = {
      amount: totalCents,
      currency: 'eur',
      capture_method: 'manual',
      metadata: {
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: listing.seller_id,
      },
    }

    if (seller?.stripe_account_id && seller.stripe_onboarding_complete) {
      piParams.application_fee_amount = feeCents
      piParams.transfer_data = { destination: seller.stripe_account_id }
    }

    const paymentIntent = await stripe.paymentIntents.create(piParams)

    // Create the order in DB
    const { data: order, error: orderError } = await supabaseService
      .from('orders')
      .insert({
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        amount,
        commission_amount,
        shipping_amount,
        total_amount,
        stripe_payment_intent_id: paymentIntent.id,
        status: 'pending_payment',
      })
      .select('id')
      .single()

    if (orderError || !order) {
      // Cancel the PI to avoid orphaned charges in every failure path.
      await stripe.paymentIntents.cancel(paymentIntent.id)

      // 23505 = unique_violation on orders_one_active_per_listing: a concurrent
      // request won the race and created the live order first. This is the
      // race-condition guard — surface a 409 rather than a generic 500.
      if (orderError?.code === '23505') {
        return NextResponse.json(
          { error: 'Otro comprador ya tiene una compra en curso para este artículo' },
          { status: 409 },
        )
      }
      return NextResponse.json({ error: 'Error al crear el pedido' }, { status: 500 })
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
    })
  } catch (err) {
    console.error('[create-payment-intent]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
