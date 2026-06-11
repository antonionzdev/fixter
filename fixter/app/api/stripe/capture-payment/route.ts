import { NextRequest, NextResponse } from 'next/server'
import { createAuthServerSupabase } from '@/lib/supabase-server-auth'
import { createServiceSupabase } from '@/lib/supabase-service'
import { getStripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const supabaseAuth = await createAuthServerSupabase()
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { orderId } = await req.json()
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'orderId requerido' }, { status: 400 })
    }

    const supabase = createServiceSupabase()
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, buyer_id, stripe_payment_intent_id, status')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }
    if (order.buyer_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
    if (!['paid', 'shipped', 'delivered'].includes(order.status)) {
      return NextResponse.json({ error: 'El pedido no puede confirmarse en su estado actual' }, { status: 409 })
    }

    const stripe = getStripe()
    const pi = await stripe.paymentIntents.capture(order.stripe_payment_intent_id)

    if (pi.status !== 'succeeded') {
      return NextResponse.json({ error: 'Error al capturar el pago' }, { status: 500 })
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', orderId)

    if (updateError) {
      return NextResponse.json({ error: 'Error al actualizar el pedido' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[capture-payment]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
