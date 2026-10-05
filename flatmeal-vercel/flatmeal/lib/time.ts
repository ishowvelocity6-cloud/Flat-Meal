export const todayISO = (tz: string, d = new Date()) => d.toLocaleDateString('en-CA', { timeZone: tz })
export const addDays = (iso: string, n: number) => {
  const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10)
}
export const mondayOf = (iso: string) => addDays(iso, -((new Date(iso + 'T00:00:00Z').getUTCDay() + 6) % 7))
export const msToMidnight = (tz: string, d = new Date()) => {
  const p: any = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' })
    .formatToParts(d).map((x) => [x.type, x.value]))
  return 86400000 - ((+p.hour * 60 + +p.minute) * 60 + +p.second) * 1000
}
export const fmtCountdown = (ms: number) => {
  const s = Math.floor(ms / 1000), z = (n: number) => String(n).padStart(2, '0')
  return `${z(Math.floor(s / 3600))}:${z(Math.floor((s % 3600) / 60))}:${z(s % 60)}`
}
