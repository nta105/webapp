import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Side Projects',
  description: 'Interactive games and personal software projects by Thien An Nguyen.',
}

export default function SideProjectsLayout({ children }: { children: ReactNode }) {
  return children
}
