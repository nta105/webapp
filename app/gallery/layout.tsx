import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Performance Gallery',
  description: "Photos from Thien An Nguyen's guitar performances, collaborations, and events.",
}

export default function GalleryLayout({ children }: { children: ReactNode }) {
  return children
}
