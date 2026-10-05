'use client'
import { useCallback, useEffect, useState } from 'react'
import { Check, Copy, RefreshCw, UserMinus } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import AppShell from '@/components/AppShell'
import MealWeek from '@/components/MealWeek'

function Body({ tz }: { tz: string }) {
  const sb = supabase()
  const [code, setCode] = useState(''), [members, setMembers] = useState<any[]>([])
  const [sel, setSel] = useState(''), [err, setErr] = useState('')
  const load = useCallback(async () => {
    const [c, m] = await Promise.all([sb.rpc('get_access_code'), sb.from('profiles').select('id,name,email,role,status').order('role')])
    setCode(c.data ?? ''); setMembers(m.data ?? [])
    setSel((s) => s || m.data?.find((x) => x.status === 'active')?.id || '')
  }, [])
  useEffect(() => { load() }, [load])
  const act = async (fn: string, args?: object) => { setErr(''); const { error } = await sb.rpc(fn, args); error ? setErr(error.message) : load() }

  return (
    <div className="space-y-8">
      {err && <p className="text-sm text-red-600">{err}</p>}
      <section className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
        <h2 className="font-semibold">Flat access code</h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code className="rounded-lg bg-stone-100 px-4 py-2 text-xl tracking-widest">{code}</code>
          <button onClick={() => navigator.clipboard.writeText(code)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"><Copy className="h-4 w-4" />Copy</button>
          <button onClick={() => confirm('Old code stops working. Continue?') && act('regenerate_code')} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"><RefreshCw className="h-4 w-4" />Reset code</button>
        </div>
      </section>
      <section className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
        <h2 className="font-semibold">Flatmates</h2>
        <ul className="mt-3 divide-y">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2 py-3">
              <div className="min-w-0"><p className="truncate font-medium">{m.name ?? m.email} {m.role === 'admin' && <span className="text-xs text-emerald-700">(manager)</span>}</p>
                <p className="truncate text-sm text-stone-500">{m.email}</p></div>
              <div className="flex shrink-0 gap-2">
                {m.status === 'pending' && <button onClick={() => act('approve_member', { p_user: m.id })} className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-sm text-white"><Check className="h-4 w-4" />Approve</button>}
                {m.role !== 'admin' && <button aria-label={`Remove ${m.name}`} onClick={() => confirm(`Remove ${m.name}?`) && act('remove_member', { p_user: m.id })} className="rounded-lg border p-2 text-red-600"><UserMinus className="h-4 w-4" /></button>}
              </div>
            </li>))}
        </ul>
      </section>
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Override meals <span className="text-sm font-normal text-stone-500">(ignores the midnight lock)</span></h2>
          <select value={sel} onChange={(e) => setSel(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
            {members.filter((m) => m.status === 'active').map((m) => <option key={m.id} value={m.id}>{m.name ?? m.email}</option>)}
          </select>
        </div>
        {sel && <MealWeek key={sel} userId={sel} tz={tz} admin />}
      </section>
    </div>)
}
export default function Admin() { return <AppShell title="Manage flat">{({ tz }) => <Body tz={tz} />}</AppShell> }
