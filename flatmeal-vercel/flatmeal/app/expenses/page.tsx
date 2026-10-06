'use client'
import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase/client'
import { addDays, todayISO } from '@/lib/time'

const fmt = (n: number) => n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function Body({ tz, admin }: { tz: string; admin: boolean }) {
  const sb = supabase(), today = todayISO(tz)
  const [month, setMonth] = useState(today.slice(0, 7))
  const [exp, setExp] = useState<any[]>([]), [mem, setMem] = useState<any[]>([]), [rows, setRows] = useState<Record<string, any>>({})
  const [date, setDate] = useState(today), [item, setItem] = useState(''), [amount, setAmount] = useState(''), [err, setErr] = useState('')
  const [y, mo] = month.split('-').map(Number), first = `${month}-01`
  const days = Array.from({ length: new Date(Date.UTC(y, mo, 0)).getUTCDate() }, (_, i) => addDays(first, i))
  const last = days[days.length - 1], cooked = days.filter((d) => d <= today) // only days already cooked count

  const load = useCallback(async () => {
    const [e, d, p] = await Promise.all([
      sb.from('expenses').select('id,spent_on,item,amount').gte('spent_on', first).lte('spent_on', last).order('spent_on'),
      sb.from('daily_meals').select('user_id,meal_date,lunch,dinner').gte('meal_date', first).lte('meal_date', last),
      sb.from('profiles').select('id,name,email,status').order('role')])
    setExp(e.data ?? []); setMem((p.data ?? []).filter((r) => r.status === 'active'))
    setRows(Object.fromEntries((d.data ?? []).map((r) => [`${r.user_id}|${r.meal_date}`, r])))
  }, [month])
  useEffect(() => { load() }, [load])

  const on = (u: string, d: string, k: 'lunch' | 'dinner') => (rows[`${u}|${d}`]?.[k] ?? 1) === 1
  const stats = mem.map((p) => {
    const l = cooked.filter((d) => on(p.id, d, 'lunch')).length, dn = cooked.filter((d) => on(p.id, d, 'dinner')).length
    return { p, l, d: dn, meals: l + dn }
  })
  const totalMeals = stats.reduce((s, x) => s + x.meals, 0)
  const total = exp.reduce((s, x) => s + Number(x.amount), 0)
  const price = totalMeals ? total / totalMeals : 0
  const shift = (n: number) => setMonth(new Date(Date.UTC(y, mo - 1 + n, 1)).toISOString().slice(0, 7))

  const add = async () => {
    setErr(''); const { error } = await sb.rpc('add_expense', { p_date: date, p_item: item, p_amount: Number(amount) })
    if (error) return setErr(error.message); setItem(''); setAmount(''); load()
  }
  const del = async (id: string) => { const { error } = await sb.rpc('delete_expense', { p_id: id }); error ? setErr(error.message) : load() }
  const card = 'rounded-2xl bg-white p-4 ring-1 ring-stone-200'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button aria-label="Previous month" onClick={() => shift(-1)} className="rounded-lg p-2 hover:bg-stone-100"><ChevronLeft /></button>
        <p className="font-medium">{new Date(first + 'T00:00:00Z').toLocaleDateString('en', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</p>
        <button aria-label="Next month" onClick={() => shift(1)} className="rounded-lg p-2 hover:bg-stone-100"><ChevronRight /></button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className={card}><p className="text-xs text-stone-500">Total expenses</p><p className="text-xl font-semibold">{fmt(total)}</p></div>
        <div className={card}><p className="text-xs text-stone-500">Meals cooked</p><p className="text-xl font-semibold">{totalMeals}</p></div>
        <div className={`${card} bg-emerald-50`}><p className="text-xs text-emerald-800">Per meal</p><p className="text-xl font-semibold text-emerald-800">{fmt(price)}</p></div>
      </div>

      <div className={card}>
        <h2 className="mb-1 font-semibold">Monthly bills</h2>
        <p className="mb-2 text-xs text-stone-500">Counts meals up to today ({cooked.length} of {days.length} days). Bill = meals × per-meal price.</p>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="text-left text-stone-500"><th className="py-1">Flatmate</th><th>Lunch</th><th>Dinner</th><th>Meals</th><th className="text-right">Bill</th></tr></thead>
          <tbody>
            {stats.map(({ p, l, d, meals }) => <tr key={p.id} className="border-t"><td className="py-2 font-medium">{(p.name ?? p.email ?? '?').split(' ')[0]}</td><td>{l}</td><td>{d}</td><td>{meals}</td><td className="text-right font-semibold">{fmt(meals * price)}</td></tr>)}
            <tr className="border-t-2 font-semibold"><td className="py-2">All</td><td colSpan={2}></td><td>{totalMeals}</td><td className="text-right">{fmt(total)}</td></tr>
          </tbody></table></div>
      </div>

      <div className={card}>
        <h2 className="mb-2 font-semibold">Grocery expenses</h2>
        {admin && (
          <div className="mb-3 grid gap-2 sm:grid-cols-[150px_1fr_130px_auto]">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-stone-300 px-3 py-2" />
            <input placeholder="Item (e.g. rice, vegetables)" value={item} onChange={(e) => setItem(e.target.value)} className="rounded-lg border border-stone-300 px-3 py-2" />
            <input type="number" inputMode="decimal" min="0" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="rounded-lg border border-stone-300 px-3 py-2" />
            <button onClick={add} disabled={!item.trim() || !(Number(amount) > 0)} className="rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white disabled:opacity-40">Add</button>
          </div>)}
        {err && <p className="mb-2 text-sm text-red-600">{err}</p>}
        {exp.length === 0 ? <p className="text-sm text-stone-500">No expenses this month yet.</p> : (
          <ul className="divide-y">{exp.map((x) => (
            <li key={x.id} className="flex items-center justify-between gap-2 py-2.5">
              <div className="min-w-0"><p className="truncate font-medium">{x.item}</p><p className="text-xs text-stone-500">{new Date(x.spent_on + 'T00:00:00Z').toLocaleDateString('en', { day: 'numeric', month: 'short', timeZone: 'UTC' })}</p></div>
              <div className="flex items-center gap-2"><span className="font-semibold">{fmt(Number(x.amount))}</span>
                {admin && <button aria-label="Delete expense" onClick={() => confirm('Delete this expense?') && del(x.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>}</div>
            </li>))}</ul>)}
      </div>
    </div>)
}
export default function Expenses() { return <AppShell title="Expenses & bills">{({ me, tz }) => <Body tz={tz} admin={me.role === 'admin'} />}</AppShell> }
