import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Coup: Reformation',
  description: 'A pass-and-play Reformation game with Catholic and Protestant factions, hidden influences, challenges, and Inquisitors.',
}

export default function CoupLayout({ children }: { children: ReactNode }) {
  return children
}
