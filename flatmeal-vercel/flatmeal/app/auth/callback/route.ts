import { NextResponse } from 'next/server'
import { serverSupabase } from '@/lib/supabase/server'
export async function GET(req: Request) {
  const { origin, searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  if (code) await (await serverSupabase()).auth.exchangeCodeForSession(code)
  return NextResponse.redirect(`${origin}/dashboard`) // middleware routes to onboarding if needed
}
