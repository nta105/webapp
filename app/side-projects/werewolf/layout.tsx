import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Werewolf Host Tool',
  description: 'A pass-and-play Werewolf game host tool with private role reveals and automated night and day phases.',
}

export default function WerewolfLayout({ children }: { children: ReactNode }) {
  return children
}
