'use client'
import { UtensilsCrossed } from 'lucide-react'

export default function Loader() {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-stone-50">
      <div className="flex flex-col items-center gap-5">
        <div className="relative h-28 w-28">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
          <UtensilsCrossed className="absolute inset-0 m-auto h-10 w-10 animate-pulse text-emerald-700" />
        </div>
        <p className="text-lg font-medium text-stone-700">Ruko jara, sabar karo…</p>
      </div>
    </div>)
}
