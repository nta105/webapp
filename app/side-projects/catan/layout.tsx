import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Catan · Classic, Seafarers & Cities',
  description: 'Choose Enhanced Classic, Seafarers: Outer Islands or custom Cities & Knights. An unofficial, bilingual local pass-and-play island game for 3–6 players.',
}

export default function CatanLayout({ children }: { children: ReactNode }) {
  return children
}
