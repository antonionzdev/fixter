'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ConnectOnboardClient({ alreadyStarted }: { alreadyStarted: boolean }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleStart() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/connect/onboard', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al iniciar'); return }
      window.location.href = data.url
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-zinc-200 p-8">
          <div className="w-14 h-14 rounded-2xl bg-[#FF6B2B]/10 flex items-center justify-center mb-6">
            <svg className="w-7 h-7 text-[#FF6B2B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="22" x2="21" y2="22"/>
              <line x1="6" y1="18" x2="6" y2="11"/>
              <line x1="10" y1="18" x2="10" y2="11"/>
              <line x1="14" y1="18" x2="14" y2="11"/>
              <line x1="18" y1="18" x2="18" y2="11"/>
              <polygon points="12 2 20 7 4 7"/>
            </svg>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 mb-2">
            {alreadyStarted ? 'Continúa con tu cuenta de cobro' : 'Configura tu cuenta de cobro'}
          </h1>
          <p className="text-sm text-zinc-500 leading-relaxed mb-6">
            Para recibir pagos de tus ventas necesitas conectar una cuenta bancaria a través de Stripe. Es rápido y seguro.
          </p>

          <ul className="space-y-3 mb-8">
            {[
              'Recibirás el importe directamente en tu cuenta bancaria',
              'Protección contra fraude incluida',
              'Stripe gestiona todo el procesamiento de pagos',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-zinc-600">
                <svg className="w-4 h-4 text-[#FF6B2B] mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {item}
              </li>
            ))}
          </ul>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full py-4 bg-zinc-950 text-white text-base font-semibold rounded-xl transition-[opacity,transform] duration-200 ease-out hover:opacity-90 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Redirigiendo a Stripe…' : alreadyStarted ? 'Continuar configuración' : 'Conectar cuenta bancaria'}
          </button>

          <button
            onClick={() => router.push('/dashboard')}
            className="mt-3 w-full py-3 text-sm font-medium text-zinc-500 hover:text-zinc-700 transition-colors duration-150"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  )
}
