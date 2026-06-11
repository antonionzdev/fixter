'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from '@/lib/format'

type State = 'idle' | 'loading' | 'done'

export default function ReceiveConfirmation({
  orderId,
  listing,
  seller,
  amount,
}: {
  orderId: string
  listing: { title: string; image: string | null; price: number }
  seller: { username: string }
  amount: number
}) {
  const [state, setState] = useState<State>('idle')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleConfirm() {
    setState('loading')
    setError(null)
    try {
      const res = await fetch('/api/stripe/capture-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al confirmar la recepción')
        setState('idle')
        return
      }
      setState('done')
      setTimeout(() => router.push(`/orders/${orderId}/tracking`), 1800)
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
      setState('idle')
    }
  }

  const f = (n: number) => formatPrice(n)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 h-14 flex items-center gap-3">
          {state === 'idle' && (
            <Link href={`/orders/${orderId}/tracking`} className="p-1 text-zinc-500 hover:text-zinc-900 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </Link>
          )}
          <span className="text-base font-bold text-zinc-950">Confirmar recepción</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className={`w-18 h-18 rounded-full flex items-center justify-center mx-auto mb-5 transition-colors duration-300 w-[72px] h-[72px] ${
            state === 'done' ? 'bg-emerald-100' : 'bg-zinc-100'
          }`}>
            {state === 'done' ? (
              <svg className="w-9 h-9 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            ) : (
              <svg className="w-9 h-9 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="21 8 21 21 3 21 3 8"/>
                <rect x="1" y="3" width="22" height="5" rx="1"/>
                <line x1="10" y1="12" x2="14" y2="12"/>
              </svg>
            )}
          </div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-950 mb-2">
            {state === 'done' ? '¡Pago liberado!' : '¿Has recibido tu pedido?'}
          </h1>
          <p className="text-sm text-zinc-500 leading-relaxed">
            {state === 'done'
              ? `${f(amount)} han sido transferidos a @${seller.username}`
              : 'Revisa que el artículo esté en buen estado antes de confirmar.'}
          </p>
        </div>

        {/* Product compact card */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 flex gap-3 items-center mb-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 flex-shrink-0 overflow-hidden">
            {listing.image ? (
              <img src={listing.image} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-5 h-5 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="5" y="2" width="14" height="20" rx="2.5"/>
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-zinc-950 truncate">{listing.title}</div>
            <div className="text-xs text-zinc-400 mt-0.5">@{seller.username}</div>
          </div>
          <div className="text-sm font-bold text-zinc-950">{f(listing.price)}</div>
        </div>

        {/* Warning / success notice */}
        {state === 'idle' && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 flex gap-2.5 items-start mb-5">
            <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p className="text-xs text-amber-900 leading-snug">
              Al confirmar, <strong>{f(amount)} se liberarán al vendedor</strong>. Solo confirma si el artículo está en perfectas condiciones.
            </p>
          </div>
        )}

        {state === 'done' && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 flex items-center gap-2.5 mb-5">
            <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span className="text-sm font-bold text-emerald-700">Transacción completada con éxito</span>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {state === 'idle' && (
          <div className="flex flex-col gap-3">
            <button
              onClick={handleConfirm}
              className="w-full py-4 bg-zinc-950 text-white text-base font-semibold rounded-xl transition-[opacity,transform] duration-200 ease-out hover:opacity-90 active:scale-[0.97]"
            >
              He recibido el pedido
            </button>
            <Link
              href={`/orders/${orderId}/dispute/type`}
              className="block w-full py-3 text-sm font-semibold text-center text-red-600 hover:text-red-700 transition-colors duration-150"
            >
              Hay un problema con mi pedido
            </Link>
          </div>
        )}

        {state === 'loading' && (
          <div className="py-5 text-center text-sm text-zinc-400 font-semibold">Procesando…</div>
        )}
      </div>
    </div>
  )
}
