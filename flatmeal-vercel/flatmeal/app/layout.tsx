import './globals.css'
export const metadata = { title: 'Flat meals' }
export const viewport = { width: 'device-width', initialScale: 1 }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className="bg-stone-50 text-stone-900 antialiased">{children}</body></html>
}
