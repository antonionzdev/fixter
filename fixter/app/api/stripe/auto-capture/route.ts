import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-service'
import { getStripe } from '@/lib/stripe'

/**
 * Auto-liberación del escrow.
 *
 * Los PaymentIntent con capture_method='manual' se CANCELAN automáticamente en
 * Stripe a los ~7 días si no se capturan. Sin esta ruta, un comprador que nunca
 * confirma la recepción dejaría al vendedor sin cobrar y el escrow expiraría.
 *
 * Esta ruta captura los pagos de pedidos que llevan suficiente tiempo enviados o
 * entregados (señal de que la transacción se completó de hecho). Debe invocarla
 * un scheduler externo (Vercel Cron / GitHub Actions / Supabase pg_cron+http)
 * con la cabecera `Authorization: Bearer ${CRON_SECRET}`.
 *
 * Seguridad:
 *  - No accesible sin el secreto CRON_SECRET (no es una ruta pública).
 *  - Idempotente: solo actúa sobre pedidos cuyo estado aún no es terminal y solo
 *    promueve a 'completed' tras una captura exitosa en Stripe.
 */
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET no configurado' }, { status: 500 })
  }

  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createServiceSupabase()
  const stripe = getStripe()

  // Ventana de auto-liberación: 48h tras la entrega confirmada, o 6 días tras el
  // envío (margen frente al límite de 7 días de Stripe) si nunca se marcó entregado.
  const deliveredCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  const shippedCutoff = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, stripe_payment_intent_id, status, delivered_at, updated_at')
    .or(
      `and(status.eq.delivered,delivered_at.lt.${deliveredCutoff}),` +
      `and(status.eq.shipped,updated_at.lt.${shippedCutoff})`,
    )

  if (error) {
    console.error('[auto-capture] query', error)
    return NextResponse.json({ error: 'Error al consultar pedidos' }, { status: 500 })
  }

  let captured = 0
  const failures: { orderId: string; reason: string }[] = []

  for (const order of orders ?? []) {
    try {
      const pi = await stripe.paymentIntents.capture(order.stripe_payment_intent_id)
      if (pi.status === 'succeeded') {
        // Guardado: solo promueve si sigue en un estado capturable.
        await supabase
          .from('orders')
          .update({ status: 'completed' })
          .eq('id', order.id)
          .in('status', ['shipped', 'delivered'])
        captured += 1
      } else {
        failures.push({ orderId: order.id, reason: `pi_status_${pi.status}` })
      }
    } catch (err) {
      failures.push({
        orderId: order.id,
        reason: err instanceof Error ? err.message : 'unknown',
      })
    }
  }

  return NextResponse.json({ captured, considered: orders?.length ?? 0, failures })
}
