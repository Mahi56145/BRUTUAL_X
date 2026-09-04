import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Engineering OS — Adaptive Study & Career Planner',
  description: 'Adaptive engineering study planner for Shivraj and Mahipal. GATE, ML, DSA, System Design — personalized every day.',
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
