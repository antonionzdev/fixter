import Link from 'next/link'

export const metadata = { title: 'Pago fallido — Fixter' }

const CAUSES = [
  { icon: 'card', label: 'Fondos insuficientes en la tarjeta' },
  { icon: 'alert', label: 'Número de tarjeta o CVV incorrectos' },
  { icon: 'ban', label: 'Tarjeta bloqueada o caducada' },
  { icon: 'bank', label: 'Límite de pago online superado' },
]

export default async function PaymentFailedPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; listingId?: string }>
}) {
  const params = await searchParams
  const retryHref = params.listingId
    ? `/checkout/${params.listingId}`
    : params.orderId
    ? `/checkout`
    : '/'

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 h-14 flex items-center gap-3">
          <Link href="/" className="p-1 text-zinc-500 hover:text-zinc-900 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </Link>
          <span className="text-base font-bold text-zinc-950">Error de pago</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-9">
          <div className="w-[72px] h-[72px] rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-red-600" viewBox="0 0 28 28" fill="none">
              <path d="M4 4L24 24M24 4L4 24" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 mb-2">Pago fallido</h1>
          <p className="text-sm text-zinc-500 mb-4">No hemos podido procesar tu pago.</p>
          <code className="inline-block text-[11px] bg-zinc-100 text-zinc-500 px-3 py-1.5 rounded-full tracking-wider">
            CARD_DECLINED
          </code>
        </div>

        {/* Causes */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 mb-5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-3">Posibles causas</div>
          <div className="grid sm:grid-cols-2 gap-2">
            {CAUSES.map(({ icon, label }) => (
              <div key={label} className="flex gap-2.5 items-center p-3 bg-zinc-50 rounded-xl text-sm text-zinc-500">
                <CauseIcon type={icon} />
                <span className="leading-snug">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={retryHref}
            className="flex-1 py-4 bg-zinc-950 text-white text-base font-semibold text-center rounded-xl transition-[opacity,transform] duration-200 ease-out hover:opacity-90 active:scale-[0.97]"
          >
            Reintentar pago
          </Link>
          <Link
            href="/"
            className="flex-1 py-4 bg-white text-zinc-950 text-sm font-semibold text-center rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-colors duration-150"
          >
            Volver al inicio
          </Link>
        </div>

        <p className="text-center mt-5 text-sm text-zinc-400 leading-relaxed">
          Si el problema persiste, <strong className="text-zinc-500">ponte en contacto con tu banco</strong> — puede haber un bloqueo de seguridad.
        </p>
      </div>
    </div>
  )
}

function CauseIcon({ type }: { type: string }) {
  const cls = 'w-4 h-4 text-zinc-400 flex-shrink-0'
  switch (type) {
    case 'card':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
    case 'alert':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    case 'ban':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
    case 'bank':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>
    default:
      return null
  }
}
