'use client'
import { useEffect, useState } from 'react'
import AppShell, { Avatar } from '@/components/AppShell'
import { supabase } from '@/lib/supabase/client'

function List() {
  const [rows, setRows] = useState<any[]>([])
  useEffect(() => {
    supabase().from('profiles').select('id,name,email,avatar_url,role,status').order('role')
      .then(({ data }) => setRows((data ?? []).filter((r) => r.status === 'active')))
  }, [])
  return (<>
    <p className="mb-4 text-sm text-stone-500">{rows.length} flatmates</p>
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-stone-200">
          <Avatar url={r.avatar_url} name={r.name ?? r.email} size={48} />
          <div className="min-w-0"><p className="truncate font-medium">{r.name ?? r.email}</p><p className="truncate text-sm text-stone-500">{r.email}</p></div>
          {r.role === 'admin' && <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">Manager</span>}
        </li>))}
    </ul></>)
}
export default function Members() { return <AppShell title="Members">{() => <List />}</AppShell> }
