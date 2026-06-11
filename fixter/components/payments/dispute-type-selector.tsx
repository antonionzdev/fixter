'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DISPUTE_TYPES } from '@/lib/types/orders'
import type { DisputeType } from '@/lib/types/orders'

function DisputeIcon({ type }: { type: string }) {
  const cls = 'w-4 h-4'
  switch (type) {
    case 'truck':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
    case 'warn':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    case 'tag':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
    case 'box':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
    case 'alertCircle':
    default:
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
  }
}

export default function DisputeTypeSelector({ orderId }: { orderId: string }) {
  const [selected, setSelected] = useState<DisputeType | null>(null)
  const router = useRouter()

  function handleContinue() {
    if (!selected) return
    router.push(`/orders/${orderId}/dispute/form?type=${selected}`)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 h-14 flex items-center gap-3">
          <Link href={`/orders/${orderId}/receive`} className="p-1 text-zinc-500 hover:text-zinc-900 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </Link>
          <span className="text-base font-bold text-zinc-950">Abrir reclamación</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-zinc-950 mb-1.5">¿Qué ha ocurrido?</h1>
        <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
          Selecciona el motivo para continuar con la reclamación. El pago permanecerá retenido hasta que se resuelva.
        </p>

        <div className="grid sm:grid-cols-2 gap-3 mb-7">
          {DISPUTE_TYPES.map((pt) => {
            const active = selected === pt.id
            return (
              <button
                key={pt.id}
                onClick={() => setSelected(pt.id)}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border-[1.5px] text-left transition-all duration-150 ${
                  active
                    ? 'border-[#FF6B2B] bg-[#FF6B2B]/[0.04]'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center ${
                  active ? 'bg-[#FF6B2B]/15 text-[#FF6B2B]' : 'bg-zinc-100 text-zinc-400'
                }`}>
                  <DisputeIcon type={pt.icon} />
                </div>
                <span className={`text-sm leading-snug ${active ? 'font-bold text-[#FF6B2B]' : 'font-medium text-zinc-950'}`}>
                  {pt.label}
                </span>
                <div className={`ml-auto w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  active ? 'border-[#FF6B2B] bg-[#FF6B2B]' : 'border-zinc-200'
                }`}>
                  {active && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            )
          })}
        </div>

        <button
          onClick={handleContinue}
          disabled={!selected}
          className="w-full py-4 bg-zinc-950 text-white text-base font-semibold rounded-xl transition-[opacity,transform] duration-200 ease-out hover:opacity-90 active:scale-[0.97] disabled:opacity-35 disabled:cursor-not-allowed"
        >
          Continuar
        </button>
      </div>
    </div>
  )
}
