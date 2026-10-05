'use client'
import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw, ChefHat } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { addDays, todayISO } from '@/lib/time'

type P = { id: string; name: string | null; email: string | null }
type K = 'lunch' | 'dinner'

export default function AdminOverview({ tz, members, tick }: { tz: string; members: P[]; tick: number }) {
  const sb = supabase()
  const today = todayISO(tz), tomorrow = addDays(today, 1)
  const [month, setMonth] = useState(today.slice(0, 7))
  const [rows, setRows] = useState<Record<string, { lunch: number; dinner: number }>>({})
  const [y, mo] = month.split('-').map(Number)
  const first = `${month}-01`
  const days = Array.from({ length: new Date(Date.UTC(y, mo, 0)).getUTCDate() }, (_, i) => addDays(first, i))
  const last = days[days.length - 1]

  const load = useCallback(async () => {
    const { data } = await sb.from('daily_meals').select('user_id,meal_date,lunch,dinner')
      .gte('meal_date', first < today ? first : today).lte('meal_date', last > tomorrow ? last : tomorrow)
    setRows(Object.fromEntries((data ?? []).map((r) => [`${r.user_id}|${r.meal_date}`, { lunch: r.lunch, dinner: r.dinner }])))
  }, [month, today])
  useEffect(() => { load() }, [load, tick])

  const on = (u: string, d: string, k: K) => (rows[`${u}|${d}`]?.[k] ?? 1) === 1
  const count = (d: string, k: K) => members.filter((p) => on(p.id, d, k)).length
  const nm = (p: P) => (p.name ?? p.email ?? '?').split(' ')[0]
  const shift = (n: number) => setMonth(new Date(Date.UTC(y, mo - 1 + n, 1)).toISOString().slice(0, 7))
  const tot = (u: string, k: K) => days.filter((d) => on(u, d, k)).length

  const Cook = ({ label, date }: { label: string; date: string }) => {
    const offs = members.map((p) => ({ n: nm(p), l: !on(p.id, date, 'lunch'), d: !on(p.id, date, 'dinner') })).filter((x) => x.l || x.d)
    return (
      <div className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
        <p className="text-sm font-medium text-stone-500">{label}</p>
        <div className="mt-2 flex gap-6">
          <div><p className="text-3xl font-semibold text-emerald-700">{count(date, 'lunch')}</p><p className="text-sm">Lunch</p></div>
          <div><p className="text-3xl font-semibold text-emerald-700">{count(date, 'dinner')}</p><p className="text-sm">Dinner</p></div>
        </div>
        <p className="mt-2 text-xs text-stone-500">{offs.length ? 'Off: ' + offs.map((x) => `${x.n} (${[x.l && 'L', x.d && 'D'].filter(Boolean).join('+')})`).join(', ') : 'Everyone is eating'}</p>
      </div>)
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold"><ChefHat className="h-5 w-5 text-emerald-700" />Cooking count</h2>
        <button onClick={load} aria-label="Refresh" className="rounded-lg border p-2"><RefreshCw className="h-4 w-4" /></button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2"><Cook label={`Today (${today})`} date={today} /><Cook label={`Tomorrow (${tomorrow})`} date={tomorrow} /></div>

      <div className="flex items-center justify-between pt-2">
        <button aria-label="Previous month" onClick={() => shift(-1)} className="rounded-lg p-2 hover:bg-stone-100"><ChevronLeft /></button>
        <p className="font-medium">{new Date(first + 'T00:00:00Z').toLocaleDateString('en', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</p>
        <button aria-label="Next month" onClick={() => shift(1)} className="rounded-lg p-2 hover:bg-stone-100"><ChevronRight /></button>
      </div>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
        <h3 className="mb-2 font-semibold">Monthly totals <span className="text-xs font-normal text-stone-500">(based on current settings, all {days.length} days)</span></h3>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-stone-500"><th className="py-1">Flatmate</th><th>Lunch</th><th>Dinner</th><th>Total</th></tr></thead>
          <tbody>
            {members.map((p) => <tr key={p.id} className="border-t"><td className="py-2 font-medium">{nm(p)}</td><td>{tot(p.id, 'lunch')}</td><td>{tot(p.id, 'dinner')}</td><td className="font-semibold">{tot(p.id, 'lunch') + tot(p.id, 'dinner')}</td></tr>)}
            <tr className="border-t-2 font-semibold"><td className="py-2">All</td>
              <td>{members.reduce((s, p) => s + tot(p.id, 'lunch'), 0)}</td><td>{members.reduce((s, p) => s + tot(p.id, 'dinner'), 0)}</td>
              <td>{members.reduce((s, p) => s + tot(p.id, 'lunch') + tot(p.id, 'dinner'), 0)}</td></tr>
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
        <h3 className="mb-1 font-semibold">Everyone's calendar</h3>
        <p className="mb-2 text-xs text-stone-500"><span className="rounded bg-emerald-100 px-1 text-emerald-800">L</span> lunch on · <span className="rounded bg-red-100 px-1 text-red-700 line-through">D</span> dinner off (red = opted out)</p>
        <div className="overflow-x-auto">
          <table className="border-separate border-spacing-0 text-xs">
            <thead><tr><th className="sticky left-0 bg-white px-2 py-1 text-left">Name</th>
              {days.map((d) => <th key={d} className={`px-0.5 py-1 font-medium ${d === today ? 'text-emerald-700' : 'text-stone-500'}`}>{+d.slice(8)}</th>)}</tr></thead>
            <tbody>
              {members.map((p) => (
                <tr key={p.id}><td className="sticky left-0 whitespace-nowrap bg-white px-2 py-1 font-medium">{nm(p)}</td>
                  {days.map((d) => (
                    <td key={d} className={`px-0.5 py-0.5 ${d === today ? 'bg-emerald-50' : ''}`}>
                      <div className="flex flex-col gap-0.5">
                        {(['lunch', 'dinner'] as K[]).map((k) => (
                          <span key={k} className={`block w-6 rounded text-center text-[10px] leading-4 ${on(p.id, d, k) ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700 line-through'}`}>{k === 'lunch' ? 'L' : 'D'}</span>))}
                      </div>
                    </td>))}
                </tr>))}
            </tbody>
          </table>
        </div>
      </div>
    </section>)
}
