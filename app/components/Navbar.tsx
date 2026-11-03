'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from './ThemeProvider'
import { Sun, Moon } from 'lucide-react'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()

  const isResume = pathname === '/resume'

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
    if (pathname !== '/') {
      return []
    }
    return [
      { href: '#about', label: 'About' },
      { href: '#performances', label: 'Performance' },
      { href: '#gallery', label: 'Gallery' },
      { href: '#support', label: 'Support' },
      { href: '#contact', label: 'Contact' },
    ]
  }

  const navLinks = getNavLinks()

  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isMenuOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMenuOpen])

  const themeLabel = theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'

  return (
    <nav aria-label="Main navigation" className="fixed top-0 w-full glass z-50 border-b border-white/10 shadow-lg shadow-black/5">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" aria-label="Thien An Nguyen home" className="text-xl font-bold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
            TAN
          </Link>
          <div className="hidden sm:flex items-center space-x-1">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all">
                {link.label}
              </a>
            ))}
            {pathname !== '/' && (
              <Link href="/" className="px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all">
                Home
              </Link>
            )}
            <Link href="/resume" aria-current={isResume ? 'page' : undefined} className="px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all">
              Resume
            </Link>
            <Link href="/side-projects" aria-current={pathname.startsWith('/side-projects') ? 'page' : undefined} className="px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all">
              Side Projects
            </Link>
            <button
              onClick={toggleTheme}
              type="button"
              aria-label={themeLabel}
              title={themeLabel}
              className="ml-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
          <div className="sm:hidden flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              type="button"
              aria-label={themeLabel}
              title={themeLabel}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              type="button"
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
      <div id="mobile-navigation" hidden={!isMenuOpen} className="sm:hidden border-t border-white/10 glass">
        <div className="px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all">
              {link.label}
            </a>
          ))}
          {pathname !== '/' && (
            <Link href="/" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all">
              Home
            </Link>
          )}
          <Link href="/resume" onClick={() => setIsMenuOpen(false)} aria-current={isResume ? 'page' : undefined} className="block px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all">
            Resume
          </Link>
          <Link href="/side-projects" onClick={() => setIsMenuOpen(false)} aria-current={pathname.startsWith('/side-projects') ? 'page' : undefined} className="block px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all">
            Side Projects
          </Link>
        </div>
      </div>
    </nav>
  )
}
