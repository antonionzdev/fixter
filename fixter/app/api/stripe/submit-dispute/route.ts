import { NextRequest, NextResponse } from 'next/server'
import { createAuthServerSupabase } from '@/lib/supabase-server-auth'
import { createServiceSupabase } from '@/lib/supabase-service'
import type { DisputeType } from '@/lib/types/orders'

const VALID_TYPES: DisputeType[] = [
  'not-received', 'damaged', 'wrong-item', 'incorrect', 'incomplete', 'other',
]

export async function POST(req: NextRequest) {
  try {
    const supabaseAuth = await createAuthServerSupabase()
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { orderId, disputeType, description, evidenceUrls } = await req.json()

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'orderId requerido' }, { status: 400 })
    }
    if (!disputeType || !VALID_TYPES.includes(disputeType)) {
      return NextResponse.json({ error: 'Tipo de reclamación inválido' }, { status: 400 })
    }
    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return NextResponse.json({ error: 'Descripción demasiado corta (mínimo 10 caracteres)' }, { status: 400 })
    }
    if (description.length > 2000) {
      return NextResponse.json({ error: 'Descripción demasiado larga' }, { status: 400 })
    }

    const urls: string[] = Array.isArray(evidenceUrls) ? evidenceUrls.filter((u: unknown) => typeof u === 'string').slice(0, 5) : []

    const supabase = createServiceSupabase()
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, buyer_id, status')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }
    if (order.buyer_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
    if (!['paid', 'shipped', 'delivered'].includes(order.status)) {
      return NextResponse.json({ error: 'No se puede reclamar en el estado actual del pedido' }, { status: 409 })
    }

    // Check no existing dispute for this order
    const { data: existingDispute } = await supabase
      .from('disputes')
      .select('id')
      .eq('order_id', orderId)
      .maybeSingle()

    if (existingDispute) {
      return NextResponse.json({ error: 'Ya existe una reclamación para este pedido' }, { status: 409 })
    }

    const { data: dispute, error: disputeError } = await supabase
      .from('disputes')
      .insert({
        order_id: orderId,
        buyer_id: user.id,
        dispute_type: disputeType,
        description: description.trim(),
        evidence_urls: urls,
        status: 'pending',
      })
      .select('id')
      .single()

    if (disputeError || !dispute) {
      return NextResponse.json({ error: 'Error al crear la reclamación' }, { status: 500 })
    }

    await supabase
      .from('orders')
      .update({ status: 'disputed' })
      .eq('id', orderId)

    return NextResponse.json({ success: true, disputeId: dispute.id })
  } catch (err) {
    console.error('[submit-dispute]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
