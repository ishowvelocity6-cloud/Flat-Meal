'use client'
import AppShell from '@/components/AppShell'
import NoticeBoard from '@/components/NoticeBoard'
export default function Notices() {
  return <AppShell title="Notices">{({ me }) => <div className="max-w-3xl"><NoticeBoard limit={50} manage={me.role === 'admin'} /></div>}</AppShell>
}
