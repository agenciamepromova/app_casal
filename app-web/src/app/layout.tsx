import type { Metadata } from 'next'
import './globals.css'
import './collaboration.css'

export const metadata: Metadata = {
  title: 'Plano a Dois',
  description: 'Finanças compartilhadas para casais',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
