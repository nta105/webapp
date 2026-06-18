export default function Header() {
  return (
    <header className="relative overflow-hidden glass-card rounded-2xl">
      {/* Gradient overlay inside header */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-purple-600/20"></div>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl animate-glow"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-glow" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="relative p-10 sm:p-16 max-w-3xl mx-auto text-center">
        <div className="mb-4">
          <span className="inline-block px-4 py-1.5 text-xs font-medium tracking-widest uppercase bg-blue-500/20 text-blue-300 rounded-full border border-blue-400/20 mb-6">
            Software Engineer
          </span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold mb-4 tracking-tight text-white">
          Thien An <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Nguyen</span>
        </h1>
        <p className="text-white/50 text-base max-w-lg mx-auto mb-8">
          Building scalable software solutions with modern technologies
        </p>
        
        {/* Contact info grid */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 text-sm">
          <span className="inline-flex items-center gap-1.5 bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 text-white/70">
            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            San Jose, CA
          </span>
          <a href="tel:+14086393430" className="inline-flex items-center gap-1.5 bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all">
            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            (408) 639-3430
          </a>
          <a href="mailto:tnguyen554@horizon.csueastbay.edu" className="inline-flex items-center gap-1.5 bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all">
            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            tnguyen554@horizon.csueastbay.edu
          </a>
          <a href="mailto:nguyenthienan96@gmail.com" className="inline-flex items-center gap-1.5 bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all">
            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            nguyenthienan96@gmail.com
          </a>
          <a href="https://github.com/nta105" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all">
            <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            github.com/nta105
          </a>
        </div>
      </div>
    </header>
  )
} 