import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Engineering Resume',
  description: 'Professional experience, education, skills, projects, and activities for Thien An Nguyen.',
}

export default function ResumeLayout({ children }: { children: ReactNode }) {
  return children
}
