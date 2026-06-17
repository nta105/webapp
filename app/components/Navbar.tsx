'use client'

import { useState } from 'react'
import { useTheme } from './ThemeProvider'
import { Sun, Moon } from 'lucide-react'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  return (
    <nav className="fixed top-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50 border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <a href="#" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            TAN
          </a>
          <div className="hidden sm:flex items-center space-x-1">
            <a href="#objective" className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all">About</a>
            <a href="#education" className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all">Education</a>
            <a href="#skills" className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all">Skills</a>
            <a href="#experience" className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all">Experience</a>
            <a href="#projects" className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all">Projects</a>
            <a href="#activities" className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all">Activities</a>
            <button
              onClick={toggleTheme}
              className="ml-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
          <div className="sm:hidden flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
        <div className="sm:hidden border-t border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
          <div className="px-4 py-3 space-y-1">
            <a href="#objective" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all">About</a>
            <a href="#education" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all">Education</a>
            <a href="#skills" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all">Skills</a>
            <a href="#experience" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all">Experience</a>
            <a href="#projects" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all">Projects</a>
            <a href="#activities" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all">Activities</a>
          </div>
        </div>
      )}
    </nav>
  )
} 