import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-service'
import { getStripe } from '@/lib/stripe'
import Stripe from 'stripe'



export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret no configurado' }, { status: 500 })
  }

  const sig = req.headers.get('stripe-signature')
  if (!sig) {
    return NextResponse.json({ error: 'Firma de webhook ausente' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const rawBody = await req.arrayBuffer()
    event = stripe.webhooks.constructEvent(Buffer.from(rawBody), sig, webhookSecret)
  } catch (err) {
    console.error('[webhook] Verificación de firma fallida:', err)
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 })
  }

  const supabase = createServiceSupabase()

  // Idempotency: skip events already processed. Stripe retries and may replay
  // events; the stripe_events table (PK = event.id) is our idempotency key.
  // We check first and RECORD AFTER successful processing — all handlers below
  // are status-guarded and idempotent, so a duplicate that races in before the
  // record is a harmless no-op, while transient handler failures are NOT lost
  // (we 500 → Stripe retries → handler runs again).
  const { data: alreadyProcessed } = await supabase
    .from('stripe_events')
    .select('id')
    .eq('id', event.id)
    .maybeSingle()

  if (alreadyProcessed) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  const piForLog =
    (event.data.object as { payment_intent?: string; id?: string } | undefined)
  const paymentIntentId =
    event.type.startsWith('payment_intent.')
      ? (event.data.object as Stripe.PaymentIntent).id
      : (piForLog?.payment_intent ?? null)

  switch (event.type) {
    // Payment authorized but not yet captured — update order to 'paid'
    case 'payment_intent.amount_capturable_updated': {
      const pi = event.data.object as Stripe.PaymentIntent
      await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('stripe_payment_intent_id', pi.id)
        .eq('status', 'pending_payment')
      break
    }

    // Payment failed — update order to 'cancelled'
    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent
      await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('stripe_payment_intent_id', pi.id)
        .eq('status', 'pending_payment')
      break
    }

    // Payment captured (receipt confirmed or auto-captured at 48h)
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent
      await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('stripe_payment_intent_id', pi.id)
        .in('status', ['delivered', 'shipped'])
      break
    }

    // Manual-capture PaymentIntent canceled (e.g. Stripe's 7-day auth expiry, or
    // an explicit cancel) — release the order so the listing frees up.
    case 'payment_intent.canceled': {
      const pi = event.data.object as Stripe.PaymentIntent
      await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('stripe_payment_intent_id', pi.id)
        .in('status', ['pending_payment', 'paid'])
      break
    }

    // Payment refunded — terminal state. Guarded so we only refund orders whose
    // money actually moved; never resurrect a cancelled/pending order.
    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge
      if (charge.payment_intent) {
        await supabase
          .from('orders')
          .update({ status: 'refunded' })
          .eq('stripe_payment_intent_id', charge.payment_intent as string)
          .in('status', ['paid', 'shipped', 'delivered', 'completed', 'disputed'])
      }
      break
    }

    default:
      break
  }

  // Record only after successful processing (forensic audit + idempotency key).
  // A unique-violation here means a concurrent delivery already recorded it —
  // harmless, since handlers are idempotent.
  const { error: recordError } = await supabase
    .from('stripe_events')
    .insert({ id: event.id, type: event.type, payment_intent_id: paymentIntentId })

  if (recordError && recordError.code !== '23505') {
    console.error('[webhook] No se pudo registrar el evento procesado:', recordError)
  }

  return NextResponse.json({ received: true })
}
