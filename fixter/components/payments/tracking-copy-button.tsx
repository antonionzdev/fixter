'use client'

import { useState } from 'react'

export default function TrackingCopyButton({
  trackingNumber,
  fullWidth = false,
}: {
  trackingNumber: string
  fullWidth?: boolean
}) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(trackingNumber).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <button
      onClick={handleCopy}
      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
        copied ? 'bg-[#FF6B2B]/10 text-[#FF6B2B]' : 'bg-zinc-100 text-zinc-950 hover:bg-zinc-200'
      } ${fullWidth ? 'w-full' : ''}`}
    >
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  )
}
