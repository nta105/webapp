import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Coup: Reformation',
  description: 'A pass-and-play Coup variant with neutral Azure and Crimson factions, private current-card checks, challenges, and Inquisitors. Last player standing wins.',
}

export default function CoupLayout({ children }: { children: ReactNode }) {
  return children
}
