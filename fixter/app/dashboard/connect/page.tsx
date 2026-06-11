import { redirect } from 'next/navigation'
import { createAuthServerSupabase } from '@/lib/supabase-server-auth'
import { createServiceSupabase } from '@/lib/supabase-service'
import ConnectOnboardClient from './ConnectOnboardClient'

export const metadata = { title: 'Conectar cuenta de cobro — Fixter' }

export default async function ConnectPage() {
  const supabase = await createAuthServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/dashboard/connect')

  // stripe_* tiene SELECT revocado para authenticated. Se leen vía service_role,
  // acotado al user.id autenticado (lectura de la propia fila).
  const serviceSupabase = createServiceSupabase()
  const { data: profile } = await serviceSupabase
    .from('profiles')
    .select('stripe_account_id, stripe_onboarding_complete')
    .eq('id', user.id)
    .single()

  if (profile?.stripe_onboarding_complete) {
    redirect('/dashboard')
  }

  return <ConnectOnboardClient alreadyStarted={!!profile?.stripe_account_id} />
}
