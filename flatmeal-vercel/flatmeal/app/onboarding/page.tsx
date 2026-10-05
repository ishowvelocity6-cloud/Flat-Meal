'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function Onboarding() {
  const sb = supabase(), router = useRouter()
  const [mode, setMode] = useState<'join' | 'create'>('join')
  const [val, setVal] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const [pending, setPending] = useState(false)

  useEffect(() => { (async () => {
    const { data: { user } } = await sb.auth.getUser()
    const { data } = await sb.from('profiles').select('flat_id,status').eq('id', user!.id).single()
    setPending(!!data?.flat_id && data.status === 'pending')
  })() }, [])

  const submit = async () => {
    setBusy(true); setErr('')
    const { error } = mode === 'join' ? await sb.rpc('join_flat', { p_code: val }) : await sb.rpc('create_flat', { p_name: val })
    setBusy(false)
    if (error) return setErr(error.message)
    router.replace('/dashboard'); router.refresh()
  }

  if (pending) return (
    <main className="min-h-dvh grid place-items-center bg-stone-50 p-6 text-center">
      <div><h1 className="text-xl font-semibold">Waiting for approval</h1>
      <p className="mt-2 text-stone-500">Your flat manager needs to approve you. Check back soon.</p>
      <button onClick={() => sb.auth.signOut().then(() => router.replace('/login'))} className="mt-4 text-sm underline">Sign out</button></div>
    </main>)

  return (
    <main className="min-h-dvh grid place-items-center bg-stone-50 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 ring-1 ring-stone-200">
        <div className="grid grid-cols-2 rounded-lg bg-stone-100 p-1 text-sm">
          {(['join', 'create'] as const).map((m) => (
            <button key={m} onClick={() => { setMode(m); setVal(''); setErr('') }}
              className={`rounded-md py-2 font-medium ${mode === m ? 'bg-white shadow-sm' : 'text-stone-500'}`}>
              {m === 'join' ? 'Join a flat' : 'Create a flat'}</button>))}
        </div>
        <label className="mt-6 block text-sm font-medium text-stone-700">{mode === 'join' ? 'Flat access code' : 'Flat name'}</label>
        <input value={val} onChange={(e) => setVal(mode === 'join' ? e.target.value.toUpperCase() : e.target.value)}
          placeholder={mode === 'join' ? 'e.g. 7K2QX9' : 'e.g. Green House 4B'}
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 tracking-wide focus:outline focus:outline-2 focus:outline-emerald-600" />
        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
        <button disabled={!val.trim() || busy} onClick={submit}
          className="mt-4 w-full rounded-lg bg-emerald-700 py-2.5 font-medium text-white disabled:opacity-40">
          {mode === 'join' ? 'Join flat' : 'Create flat'}</button>
        {mode === 'create' && <p className="mt-3 text-xs text-stone-500">You will become the flat manager and get an access code to share.</p>}
      </div>
    </main>)
}
