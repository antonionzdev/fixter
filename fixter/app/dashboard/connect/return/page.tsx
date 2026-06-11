'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ConnectReturnPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'checking' | 'success' | 'incomplete'>('checking')

  useEffect(() => {
    async function verify() {
      const res = await fetch('/api/stripe/connect/verify', { method: 'POST' })
      const data = await res.json()
      setStatus(data.complete ? 'success' : 'incomplete')
    }
    verify()
  }, [])

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-zinc-200 p-8 text-center">
        {status === 'checking' && (
          <p className="text-sm text-zinc-500">Verificando tu cuenta…</p>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-zinc-950 mb-2">Cuenta conectada</h1>
            <p className="text-sm text-zinc-500 mb-6">Ya puedes recibir pagos de tus ventas en Fixter.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-4 bg-zinc-950 text-white text-base font-semibold rounded-xl hover:opacity-90 active:scale-[0.97] transition-[opacity,transform] duration-200"
            >
              Ir al panel
            </button>
          </>
        )}

        {status === 'incomplete' && (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-zinc-950 mb-2">Configuración incompleta</h1>
            <p className="text-sm text-zinc-500 mb-6">Falta completar algún dato en Stripe para activar los cobros.</p>
            <button
              onClick={() => router.push('/dashboard/connect')}
              className="w-full py-4 bg-zinc-950 text-white text-base font-semibold rounded-xl hover:opacity-90 active:scale-[0.97] transition-[opacity,transform] duration-200"
            >
              Continuar configuración
            </button>
          </>
        )}
      </div>
    </div>
  )
}
