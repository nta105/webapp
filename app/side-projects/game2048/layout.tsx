import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: '2048 Puzzle Game',
  description: 'Play the classic 2048 sliding puzzle game in your browser.',
}

export default function Game2048Layout({ children }: { children: ReactNode }) {
  return children
}
