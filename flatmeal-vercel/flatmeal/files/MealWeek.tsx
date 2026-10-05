'use client'
import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Lock, Timer } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { addDays, fmtCountdown, mondayOf, msToMidnight, todayISO } from '@/lib/time'

type M = { lunch: number; dinner: number }
const Switch = ({ on, disabled, label, onClick }: { on: boolean; disabled: boolean; label: string; onClick: () => void }) => (
  <button role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={onClick}
    className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? 'bg-emerald-600' : 'bg-stone-300'} ${disabled ? 'opacity-50' : ''}`}>
    <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
  </button>)

export default function MealWeek({ userId, tz, admin = false, onChange }: { userId: string; tz: string; admin?: boolean; onChange?: () => void }) {
  const sb = supabase()
  const [start, setStart] = useState(mondayOf(todayISO(tz)))
  const [meals, setMeals] = useState<Record<string, M>>({})
  const [left, setLeft] = useState(msToMidnight(tz)), [err, setErr] = useState('')
  const today = todayISO(tz)
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))

  useEffect(() => { const t = setInterval(() => setLeft(msToMidnight(tz)), 1000); return () => clearInterval(t) }, [tz])

  const load = useCallback(async () => {
    const { data } = await sb.from('daily_meals').select('meal_date,lunch,dinner').eq('user_id', userId).gte('meal_date', start).lte('meal_date', addDays(start, 6))
    setMeals(Object.fromEntries((data ?? []).map((r) => [r.meal_date, { lunch: r.lunch, dinner: r.dinner }])))
  }, [userId, start])
  useEffect(() => { load() }, [load])

  const toggle = async (date: string, k: keyof M) => {
    const cur = meals[date] ?? { lunch: 1, dinner: 1 }, next = { ...cur, [k]: cur[k] ? 0 : 1 }
    setMeals((m) => ({ ...m, [date]: next })); setErr('')
    const { error } = await sb.rpc('set_meal', { p_user: userId, p_date: date, p_lunch: next.lunch, p_dinner: next.dinner })
    if (error) { setErr(error.message); load() } else onChange?.()
  }

  return (
    <section>
      {!admin && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-emerald-50 p-3 text-emerald-900">
          <Timer className="h-5 w-5" />
          <p className="text-sm">Tomorrow locks at midnight: <b className="tabular-nums">{fmtCountdown(left)}</b></p>
        </div>)}
      <div className="mb-3 flex items-center justify-between">
        <button aria-label="Previous week" onClick={() => setStart(addDays(start, -7))} className="rounded-lg p-2 hover:bg-stone-100"><ChevronLeft /></button>
        <p className="font-medium">{new Date(start + 'T00:00:00Z').toLocaleDateString('en', { month: 'short', day: 'numeric', timeZone: 'UTC' })} – {new Date(addDays(start, 6) + 'T00:00:00Z').toLocaleDateString('en', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</p>
        <button aria-label="Next week" onClick={() => setStart(addDays(start, 7))} className="rounded-lg p-2 hover:bg-stone-100"><ChevronRight /></button>
      </div>
      {err && <p className="mb-2 text-sm text-red-600">{err}</p>}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {days.map((d) => {
          const m = meals[d] ?? { lunch: 1, dinner: 1 }
          const locked = !admin && d <= today
          const status = locked ? 'Locked' : !m.lunch && !m.dinner ? 'Opted out' : 'Active'
          const tone = locked ? 'bg-stone-100 text-stone-600' : status === 'Opted out' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
          return (
            <li key={d} className={`rounded-2xl bg-white p-4 ring-1 ${d === today ? 'ring-2 ring-emerald-600' : 'ring-stone-200'}`}>
              <div className="flex items-center justify-between">
                <p className="font-medium">{new Date(d + 'T00:00:00Z').toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })}</p>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>{locked && <Lock className="h-3 w-3" />}{status}</span>
              </div>
              {(['lunch', 'dinner'] as const).map((k) => (
                <div key={k} className="mt-3 flex items-center justify-between">
                  <span className="capitalize text-stone-700">{k}</span>
                  <Switch on={!!m[k]} disabled={locked} label={`${k} on ${d}`} onClick={() => toggle(d, k)} />
                </div>))}
            </li>)
        })}
      </ul>
    </section>)
}
