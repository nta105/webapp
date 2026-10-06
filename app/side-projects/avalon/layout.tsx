import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'The Resistance | Side Projects',
  description: 'Pass-and-play basic Resistance and optional Commander roles, with standard 5-10 and experimental 11-20 player setups.',
}

export default function AvalonLayout({ children }: { children: ReactNode }) {
  return children
}