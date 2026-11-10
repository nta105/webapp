import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Catan · Enhanced Classic',
  description: 'An unofficial, original-art island building game for 3–6 players. Explore, trade and build in local pass-and-play.',
}

export default function CatanLayout({ children }: { children: ReactNode }) {
  return children
}
