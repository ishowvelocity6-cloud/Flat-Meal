'use client'
import { useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

export default function Loader() {
  const ref = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)
  const toggle = () => { const v = ref.current; if (v) { v.muted = !muted; v.play().catch(() => {}) } setMuted(!muted) }
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-stone-950 p-4">
      <div className="relative w-full max-w-[260px]">
        <video ref={ref} src="/loading.mp4" autoPlay muted loop playsInline preload="auto" className="aspect-[9/16] w-full rounded-2xl bg-black object-cover" />
        <button aria-label={muted ? 'Turn sound on' : 'Turn sound off'} onClick={toggle} className="absolute right-2 top-2 rounded-full bg-black/60 p-2 text-white">
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
        <p className="mt-3 text-center text-sm text-stone-300">Ruk ja, do minute… loading</p>
      </div>
    </div>)
}
