import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req })
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (c) => {
        c.forEach(({ name, value }) => req.cookies.set(name, value))
        res = NextResponse.next({ request: req })
        c.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      },
    },
  })
  const go = (to: string) => NextResponse.redirect(new URL(to, req.url))
  const p = req.nextUrl.pathname
  if (p.startsWith('/auth')) return res

  const { data: { user } } = await sb.auth.getUser()
  if (!user) return p.startsWith('/login') ? res : go('/login')

  const { data: me } = await sb.from('profiles').select('flat_id,role,status').eq('id', user.id).single()
  const inFlat = !!me?.flat_id && me.status === 'active'
  if (!inFlat) return p.startsWith('/onboarding') ? res : go('/onboarding') // no flat or pending approval
  if (p === '/' || p.startsWith('/login') || p.startsWith('/onboarding')) return go('/dashboard')
  if (p.startsWith('/admin') && me!.role !== 'admin') return go('/dashboard')
  return res
}
export const config = { matcher: ['/((?!_next|favicon.ico|.*\\.(?:svg|png|ico)$).*)'] }
