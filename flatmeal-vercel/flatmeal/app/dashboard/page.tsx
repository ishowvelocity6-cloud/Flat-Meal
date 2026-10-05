'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, Settings } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import MealWeek from '@/components/MealWeek'

export default function Dashboard() {
  const sb = supabase(), router = useRouter()
  const [me, setMe] = useState<any>(), [tz, setTz] = useState<string>()
  useEffect(() => { (async () => {
    const { data: { user } } = await sb.auth.getUser()
    const { data: p } = await sb.from('profiles').select('id,name,role,flat_id').eq('id', user!.id).single()
    const { data: f } = await sb.from('flats').select('name,timezone').single()
    setMe({ ...p, flat: f?.name }); setTz(f?.timezone)
  })() }, [])
  if (!me || !tz) return <p className="p-6 text-stone-500">Loading…</p>
  return (
    <main className="mx-auto max-w-5xl bg-stone-50 p-4 sm:p-6">
      <header className="mb-6 flex items-center justify-between">
        <div><h1 className="text-xl font-semibold">{me.flat}</h1><p className="text-sm text-stone-500">Hi {me.name?.split(' ')[0]}, your meals this week</p></div>
        <div className="flex gap-1">
          {me.role === 'admin' && <Link href="/admin" aria-label="Manage flat" className="rounded-lg p-2 hover:bg-stone-100"><Settings /></Link>}
          <button aria-label="Sign out" onClick={() => sb.auth.signOut().then(() => router.replace('/login'))} className="rounded-lg p-2 hover:bg-stone-100"><LogOut /></button>
        </div>
      </header>
      <MealWeek userId={me.id} tz={tz} />
    </main>)
}
