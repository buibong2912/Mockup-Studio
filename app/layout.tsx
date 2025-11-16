import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mockup Design Tool',
  description: 'Batch compositing designs onto mockups',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}


