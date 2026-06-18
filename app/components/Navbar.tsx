'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from './ThemeProvider'
import { Sun, Moon } from 'lucide-react'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()

  const isResume = pathname.startsWith('/resume')
  const isWerewolf = pathname.startsWith('/side-projects/werewolf')
  const isSideProjects = pathname === '/side-projects'
  const isGallery = pathname.startsWith('/gallery')

  const getNavLinks = () => {
    if (isResume) {
      return [
        { href: '#objective', label: 'About' },
        { href: '#education', label: 'Education' },
        { href: '#skills', label: 'Skills' },
        { href: '#experience', label: 'Experience' },
        { href: '#projects', label: 'Projects' },
        { href: '#activities', label: 'Activities' },
      ]
    }
    if (isWerewolf || isSideProjects || isGallery) {
      return []
    }
    // Guitar main page
    return [
      { href: '#about', label: 'About' },
      { href: '#performances', label: 'Performance' },
      { href: '#gallery', label: 'Gallery' },
      { href: '#support', label: 'Support' },
      { href: '#contact', label: 'Contact' },
    ]
  }

  const navLinks = getNavLinks()

  return (
    <nav className="fixed top-0 w-full glass z-50 border-b border-white/10 shadow-lg shadow-black/5">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
            TAN
          </Link>
          <div className="hidden sm:flex items-center space-x-1">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all">
                {link.label}
              </a>
            ))}
            <Link href="/side-projects" className="px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all">
              Side Projects
            </Link>
            <button
              onClick={toggleTheme}
              className="ml-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
          <div className="sm:hidden flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div className="sm:hidden border-t border-white/10 glass">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all">
                {link.label}
              </a>
            ))}
            <Link href="/side-projects" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all">
              Side Projects
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
