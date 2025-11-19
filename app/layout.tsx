import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Print Studio - Professional Mockup Design Tool',
  description: 'Create stunning print-on-demand mockups with batch compositing. Professional design tool for creating product mockups.',
  keywords: 'mockup, print on demand, design tool, batch processing, product mockup',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased">{children}</body>
    </html>
  )
}


