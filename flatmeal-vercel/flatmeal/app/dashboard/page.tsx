'use client'
import AppShell from '@/components/AppShell'
import MealWeek from '@/components/MealWeek'

export default function Dashboard() {
  return (
    <AppShell title="My meals">
      {({ me, tz }) => (<>
        <p className="mb-4 text-stone-500">Hi {(me.name ?? '').split(' ')[0] || 'there'}, your meals this week</p>
        <MealWeek userId={me.id} tz={tz} />
      </>)}
    </AppShell>)
}
