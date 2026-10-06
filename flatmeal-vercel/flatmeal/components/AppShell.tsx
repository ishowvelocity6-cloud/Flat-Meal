'use client'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Camera, CalendarDays, ChefHat, LogOut, Megaphone, Menu, Receipt, Settings, UserCog, Users, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export type Me = { id: string; name: string | null; email: string | null; avatar_url: string | null; role: string }
export type Ctx = { me: Me; tz: string; flat: string }

export const Avatar = ({ url, name, size = 36 }: { url?: string | null; name?: string | null; size?: number }) =>
  url ? <img src={url} alt="" style={{ width: size, height: size }} className="rounded-full object-cover" />
    : <span style={{ width: size, height: size }} className="grid shrink-0 place-items-center rounded-full bg-emerald-100 font-semibold text-emerald-800">{(name ?? '?').trim()[0]?.toUpperCase()}</span>

export default function AppShell({ title, children }: { title: string; children: (c: Ctx) => ReactNode }) {
  const sb = supabase(), router = useRouter(), path = usePathname()
  const [ctx, setCtx] = useState<Ctx>()
  const [menu, setMenu] = useState(false), [prof, setProf] = useState(false), [edit, setEdit] = useState(false)

  const load = useCallback(async () => {
    const { data: { user } } = await sb.auth.getUser()
    const { data: me } = await sb.from('profiles').select('id,name,email,avatar_url,role').eq('id', user!.id).single()
    const { data: f } = await sb.from('flats').select('name,timezone').single()
    setCtx({ me: me as Me, tz: f?.timezone ?? 'Asia/Dhaka', flat: f?.name ?? '' })
  }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMenu(false); setProf(false) } }
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  }, [])
  const signOut = async () => { await sb.auth.signOut(); router.replace('/login'); router.refresh() }

  if (!ctx) return <p className="p-6 text-stone-500">Loading…</p>
  const { me } = ctx
  const nav = [
    { href: '/dashboard', label: 'My meals', Icon: CalendarDays },
    { href: '/notices', label: 'Notices', Icon: Megaphone },
    { href: '/meal-count', label: 'Meal count', Icon: ChefHat },
    { href: '/expenses', label: 'Expenses & bills', Icon: Receipt },
    { href: '/members', label: 'Members', Icon: Users },
    ...(me.role === 'admin' ? [{ href: '/admin', label: 'Manage flat', Icon: Settings }] : []),
  ]

  return (
    <div className="min-h-dvh bg-stone-50">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200 bg-white/90 px-3 py-2 backdrop-blur">
        <button aria-label="Open menu" onClick={() => setMenu(true)} className="rounded-lg p-2 hover:bg-stone-100"><Menu /></button>
        <div className="text-center leading-tight"><p className="font-semibold">{ctx.flat}</p><p className="text-xs text-stone-500">{title}</p></div>
        <div className="relative">
          <button aria-label="Profile" onClick={() => setProf((p) => !p)} className="rounded-full ring-2 ring-transparent hover:ring-emerald-200"><Avatar url={me.avatar_url} name={me.name ?? me.email} /></button>
          {prof && (<>
            <div className="fixed inset-0 z-30" onClick={() => setProf(false)} />
            <div className="absolute right-0 z-40 mt-2 w-64 rounded-xl bg-white p-2 shadow-lg ring-1 ring-stone-200">
              <div className="flex items-center gap-3 p-2"><Avatar url={me.avatar_url} name={me.name ?? me.email} size={44} />
                <div className="min-w-0"><p className="truncate font-medium">{me.name ?? 'No name'}</p><p className="truncate text-xs text-stone-500">{me.email}</p></div></div>
              <button onClick={() => { setProf(false); setEdit(true) }} className="flex w-full items-center gap-2 rounded-lg p-2 text-left hover:bg-stone-100"><UserCog className="h-4 w-4" />Edit profile</button>
              <button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" />Sign out</button>
            </div></>)}
        </div>
      </header>

      {menu && <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setMenu(false)} />}
      <aside aria-hidden={!menu} className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-xl transition-transform ${menu ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-stone-200 p-4">
          <div><p className="font-semibold">{ctx.flat}</p><p className="text-xs text-stone-500">{me.role === 'admin' ? 'Manager' : 'Flatmate'}</p></div>
          <button aria-label="Close menu" onClick={() => setMenu(false)} className="rounded-lg p-2 hover:bg-stone-100"><X /></button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map(({ href, label, Icon }) => (
            <Link key={href} href={href} onClick={() => setMenu(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 font-medium ${path === href ? 'bg-emerald-50 text-emerald-800' : 'text-stone-700 hover:bg-stone-100'}`}>
              <Icon className="h-5 w-5" />{label}</Link>))}
        </nav>
        <div className="border-t border-stone-200 p-3">
          <button onClick={() => { setMenu(false); setEdit(true) }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-stone-700 hover:bg-stone-100"><UserCog className="h-5 w-5" />Edit profile</button>
          <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-red-600 hover:bg-red-50"><LogOut className="h-5 w-5" />Sign out</button>
        </div>
      </aside>

      <main className="mx-auto max-w-5xl p-4 sm:p-6">{children(ctx)}</main>
      {edit && <ProfileModal me={me} onClose={() => setEdit(false)} onSaved={() => { setEdit(false); load() }} />}
    </div>)
}

function ProfileModal({ me, onClose, onSaved }: { me: Me; onClose: () => void; onSaved: () => void }) {
  const sb = supabase()
  const [name, setName] = useState(me.name ?? ''), [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState(me.avatar_url), [busy, setBusy] = useState(false), [err, setErr] = useState('')

  const save = async () => {
    setBusy(true); setErr('')
    try {
      let url: string | null = null
      if (file) {
        const bmp = await createImageBitmap(file), s = 256, m = Math.min(bmp.width, bmp.height)
        const c = document.createElement('canvas'); c.width = c.height = s
        c.getContext('2d')!.drawImage(bmp, (bmp.width - m) / 2, (bmp.height - m) / 2, m, m, 0, 0, s, s)
        const blob: Blob = await new Promise((r) => c.toBlob((b) => r(b!), 'image/jpeg', 0.85))
        const path = `${me.id}/avatar.jpg`
        const up = await sb.storage.from('avatars').upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
        if (up.error) throw up.error
        url = sb.storage.from('avatars').getPublicUrl(path).data.publicUrl + '?v=' + Date.now()
      }
      const { error } = await sb.rpc('update_profile', { p_name: name, p_avatar: url })
      if (error) throw error
      onSaved()
    } catch (e: any) { setErr(e.message ?? 'Something went wrong') }
    setBusy(false)
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">Edit profile</h2>
        <div className="mt-4 flex items-center gap-4">
          <Avatar url={preview} name={name || me.email} size={72} />
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium hover:bg-stone-50">
            <Camera className="h-4 w-4" />Change photo
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setPreview(URL.createObjectURL(f)) } }} />
          </label>
        </div>
        <label className="mt-4 block text-sm font-medium text-stone-700">Display name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:outline focus:outline-2 focus:outline-emerald-600" />
        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-stone-300 py-2.5 font-medium">Cancel</button>
          <button onClick={save} disabled={busy} className="flex-1 rounded-lg bg-emerald-700 py-2.5 font-medium text-white disabled:opacity-50">{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>)
}
