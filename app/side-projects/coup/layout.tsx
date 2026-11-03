import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Coup',
  description: 'A pass-and-play Coup card game with hidden influences, challenges, blocks, and coups.',
}

export default function CoupLayout({ children }: { children: ReactNode }) {
  return children
}
