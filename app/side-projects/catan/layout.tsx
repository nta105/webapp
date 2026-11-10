import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Catan · Classic & Seafarers',
  description: 'Choose Enhanced Classic or Seafarers: Outer Islands. An unofficial, original-art, bilingual local pass-and-play island game.',
}

export default function CatanLayout({ children }: { children: ReactNode }) {
  return children
}
