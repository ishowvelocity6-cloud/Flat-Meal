'use client'
import { useCallback, useEffect, useState } from 'react'
import { Megaphone, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

type N = { id: string; body: string; created_at: string }
export default function NoticeBoard({ limit = 3, manage = false }: { limit?: number; manage?: boolean }) {
  const sb = supabase()
  const [list, setList] = useState<N[]>([]), [text, setText] = useState(''), [err, setErr] = useState('')
  const load = useCallback(async () => {
    const { data } = await sb.from('notices').select('id,body,created_at').order('created_at', { ascending: false }).limit(limit)
    setList(data ?? [])
  }, [limit])
  useEffect(() => { load() }, [load])
  const post = async () => { setErr(''); const { error } = await sb.rpc('post_notice', { p_body: text }); if (error) return setErr(error.message); setText(''); load() }
  const del = async (id: string) => { const { error } = await sb.rpc('delete_notice', { p_id: id }); error ? setErr(error.message) : load() }
  if (!manage && !list.length) return null

  return (
    <section className="mb-5 space-y-3">
      {manage && (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
          <label className="text-sm font-medium">New notice (shown on everyone's home page)</label>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={500}
            className="mt-2 w-full rounded-lg border border-stone-300 p-3 focus:outline focus:outline-2 focus:outline-emerald-600" placeholder="e.g. No dinner on Friday, rent due on the 5th" />
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button onClick={post} disabled={!text.trim()} className="mt-2 rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white disabled:opacity-40">Post notice</button>
        </div>)}
      {list.map((n) => (
        <div key={n.id} className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-sm">
          <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div className="min-w-0 flex-1"><p className="whitespace-pre-wrap break-words text-amber-950">{n.body}</p>
            <p className="mt-1 text-xs text-amber-800">{new Date(n.created_at).toLocaleDateString('en', { day: 'numeric', month: 'short' })}</p></div>
          {manage && <button aria-label="Delete notice" onClick={() => confirm('Delete this notice?') && del(n.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>}
        </div>))}
    </section>)
}
