'use client'
import { supabase } from '@/lib/supabase/client'
import { UtensilsCrossed } from 'lucide-react'

export default function Login() {
  const signIn = () => supabase().auth.signInWithOAuth({
    provider: 'google', options: { redirectTo: `${location.origin}/auth/callback`, queryParams: { prompt: 'select_account' } },
  })
  return (
    <main className="min-h-dvh grid place-items-center bg-stone-50 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200 text-center">
        <UtensilsCrossed className="mx-auto h-8 w-8 text-emerald-700" />
        <h1 className="mt-4 text-2xl font-semibold text-stone-900">Flat meals</h1>
        <p className="mt-1 text-sm text-stone-500">Sign in to set your lunch and dinner.</p>
        <button onClick={signIn} className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-stone-300 px-4 py-3 font-medium text-stone-800 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600">
          <svg viewBox="0 0 48 48" className="h-5 w-5"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.7 6.9l7.3 5.7c4.3-4 6.8-9.9 6.8-17.1z"/><path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.3-5.7c-2 1.4-4.9 2.3-8.6 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>
          Sign in with Google
        </button>
      </div>
    </main>
  )
}
