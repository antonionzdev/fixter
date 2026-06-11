import { NextRequest, NextResponse } from 'next/server'
import { createAuthServerSupabase } from '@/lib/supabase-server-auth'
import { createServiceSupabase } from '@/lib/supabase-service'
import { CARRIERS } from '@/lib/types/orders'

const CARRIER_VALUES = CARRIERS as readonly string[]

export async function POST(req: NextRequest) {
  try {
    const supabaseAuth = await createAuthServerSupabase()
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { orderId, trackingNumber, carrier } = await req.json()

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'orderId requerido' }, { status: 400 })
    }
    if (!trackingNumber || typeof trackingNumber !== 'string' || trackingNumber.trim().length < 5) {
      return NextResponse.json({ error: 'Número de seguimiento inválido' }, { status: 400 })
    }
    if (!carrier || !CARRIER_VALUES.includes(carrier)) {
      return NextResponse.json({ error: 'Transportista inválido' }, { status: 400 })
    }

    const supabase = createServiceSupabase()
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, seller_id, status')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }
    if (order.seller_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
    if (order.status !== 'paid') {
      return NextResponse.json({ error: 'Solo puedes añadir tracking a pedidos pagados' }, { status: 409 })
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        tracking_number: trackingNumber.trim().toUpperCase(),
        carrier,
        status: 'shipped',
      })
      .eq('id', orderId)

    if (updateError) {
      return NextResponse.json({ error: 'Error al actualizar el pedido' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[add-tracking]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
