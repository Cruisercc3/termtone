import type { Metadata } from 'next'
import { Share_Tech_Mono, VT323 } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const shareTechMono = Share_Tech_Mono({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-mono',
})

const vt323 = VT323({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'TermTone — Terminal Soundboard for Developers',
  description: 'Give your terminal a voice. Typewriter sounds, AI cues, phase alerts and a fully customizable soundboard — built for solo devs who ship with style.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${shareTechMono.variable} ${vt323.variable} font-mono antialiased crt-scanlines`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
