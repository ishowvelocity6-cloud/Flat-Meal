'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import AdminOverview from '@/components/AdminOverview'
import { supabase } from '@/lib/supabase/client'

function Body({ tz }: { tz: string }) {
  const [members, setMembers] = useState<any[]>([])
  useEffect(() => {
    supabase().from('profiles').select('id,name,email,status').order('role')
      .then(({ data }) => setMembers((data ?? []).filter((r) => r.status === 'active')))
  }, [])
  return <AdminOverview tz={tz} members={members} tick={0} />
}
export default function MealCount() { return <AppShell title="Meal count">{({ tz }) => <Body tz={tz} />}</AppShell> }
