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

    const supabase = createServiceSupabase()
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_account_id) {
      return NextResponse.json({ complete: false })
    }

    const stripe = getStripe()
    const account = await stripe.accounts.retrieve(profile.stripe_account_id)
    const complete = account.details_submitted && account.charges_enabled

    if (complete) {
      await supabase
        .from('profiles')
        .update({ stripe_onboarding_complete: true })
        .eq('id', user.id)
    }

    return NextResponse.json({ complete })
  } catch (err) {
    console.error('[connect-verify]', err)
    return NextResponse.json({ error: 'Error al verificar la cuenta' }, { status: 500 })
  }
}
