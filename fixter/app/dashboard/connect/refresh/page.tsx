import { redirect } from 'next/navigation'

// Stripe redirects here when the onboarding link expires
// We just send them back to start a new one
export default function ConnectRefreshPage() {
  redirect('/dashboard/connect')
}
