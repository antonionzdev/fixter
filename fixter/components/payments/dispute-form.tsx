'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from '@/lib/format'
import type { DisputeType } from '@/lib/types/orders'
import { getSupabase } from '@/lib/supabase'

const MAX_CHARS = 500
const MAX_PHOTOS = 3

export default function DisputeForm({
  orderId,
  disputeType,
  typeLabel,
  listing,
}: {
  orderId: string
  disputeType: DisputeType
  typeLabel: string
  listing: { title: string; image: string | null; price: number }
}) {
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const canSubmit = description.trim().length >= 10 && !submitting

  function handleFiles(files: FileList | null) {
    if (!files) return
    const valid = Array.from(files).filter((f) => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024)
    setPhotos((prev) => [...prev, ...valid].slice(0, MAX_PHOTOS))
  }

  async function uploadPhotos(): Promise<string[]> {
    if (photos.length === 0) return []
    setUploading(true)
    const supabase = getSupabase()
    const urls: string[] = []
    for (const file of photos) {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `disputes/${orderId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('listing-images').upload(path, file)
      if (!uploadError) {
        const { data } = supabase.storage.from('listing-images').getPublicUrl(path)
        urls.push(data.publicUrl)
      }
    }
    setUploading(false)
    return urls
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setError(null)

    try {
      const evidenceUrls = await uploadPhotos()
      const res = await fetch('/api/stripe/submit-dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          disputeType,
          description: description.trim(),
          evidenceUrls,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al enviar la reclamación')
        setSubmitting(false)
        return
      }
      router.push(`/orders/${orderId}/dispute/sent`)
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 h-14 flex items-center gap-3">
          <Link href={`/orders/${orderId}/dispute/type`} className="p-1 text-zinc-500 hover:text-zinc-900 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </Link>
          <span className="text-base font-bold text-zinc-950">Describe el problema</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 lg:grid lg:grid-cols-[1fr_280px] lg:gap-7 lg:items-start">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Type pill */}
          <div className="inline-flex items-center gap-2 bg-[#FF6B2B]/10 rounded-xl px-3.5 py-2.5 self-start">
            <svg className="w-3.5 h-3.5 text-[#FF6B2B] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span className="text-sm font-semibold text-[#FF6B2B]">{typeLabel}</span>
          </div>

          {/* Product card (mobile only) */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-4 flex gap-3 items-center lg:hidden">
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
              <div className="text-xs text-zinc-400 mt-0.5">Pedido #{orderId.slice(0, 6).toUpperCase()}</div>
            </div>
            <div className="text-sm font-bold text-zinc-950">{formatPrice(listing.price)}</div>
          </div>

          {/* Photos */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-3">Añade fotos del problema</div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            {photos.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {photos.map((file, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-100">
                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="aspect-square rounded-xl border-[1.5px] border-dashed border-zinc-200 flex items-center justify-center text-zinc-400 hover:border-zinc-300 transition-colors"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-24 rounded-xl border-[1.5px] border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center gap-2 hover:border-zinc-300 hover:bg-zinc-100 transition-all duration-150"
              >
                <svg className="w-6 h-6 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                <span className="text-xs font-semibold text-zinc-400">Toca para añadir fotos</span>
                <span className="text-[11px] text-zinc-400">JPG, PNG · Máx. 10 MB · Hasta {MAX_PHOTOS} fotos</span>
              </button>
            )}
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-3">Descripción</div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_CHARS))}
              placeholder="Describe con detalle qué ha ocurrido y el estado en que has recibido el artículo…"
              rows={5}
              className={`w-full px-3.5 py-3 rounded-xl border text-sm font-medium text-zinc-950 bg-zinc-50 resize-none leading-relaxed transition-colors duration-150 focus:outline-none ${
                description.length > 0 ? 'border-[#FF6B2B]' : 'border-zinc-200'
              }`}
            />
            <div className="text-right text-xs text-zinc-400 mt-1.5">{description.length}/{MAX_CHARS}</div>
          </div>

          {/* Info notice */}
          <div className="rounded-xl bg-zinc-100 px-4 py-3 flex gap-2.5 items-start">
            <svg className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <p className="text-xs text-zinc-500 leading-relaxed">
              El pago permanecerá retenido mientras el equipo de soporte revisa tu reclamación. Te responderemos en menos de 48h.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || uploading}
            className="w-full py-4 bg-zinc-950 text-white text-base font-semibold rounded-xl transition-[opacity,transform] duration-200 ease-out hover:opacity-90 active:scale-[0.97] disabled:opacity-35 disabled:cursor-not-allowed"
          >
            {submitting || uploading ? 'Enviando…' : 'Enviar reclamación'}
          </button>
        </form>

        {/* Right sidebar (desktop) */}
        <div className="hidden lg:flex flex-col gap-4 mt-0">
          <div className="bg-white rounded-2xl border border-zinc-200 p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-3">Artículo reclamado</div>
            <div className="flex gap-3 items-center">
              <div className="w-14 h-14 rounded-xl bg-zinc-100 flex-shrink-0 overflow-hidden">
                {listing.image ? (
                  <img src={listing.image} alt={listing.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="5" y="2" width="14" height="20" rx="2.5"/>
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <div className="text-sm font-bold text-zinc-950">{listing.title}</div>
                <div className="text-sm font-bold text-zinc-950 mt-1">{formatPrice(listing.price)}</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-100 text-xs text-zinc-500">
              Pedido <strong className="text-zinc-950">#{orderId.slice(0, 6).toUpperCase()}</strong>
            </div>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-4 flex gap-2.5 items-start">
            <svg className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <p className="text-xs text-zinc-500 leading-relaxed">
              El pago permanecerá retenido hasta la resolución. El equipo de soporte te responderá en menos de 48h.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
