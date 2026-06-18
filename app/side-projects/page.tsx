import Link from 'next/link'

export default function SideProjects() {
  const projects = [
    {
      title: '🎸 Guitar — Thien An Nguyen',
      description: 'Professional guitarist & music instructor portfolio showcasing live performances, collaborations with renowned artists, and music instruction services.',
      href: '/side-projects/guitar',
      tags: ['Music', 'Portfolio', 'Performance'],
    },
    {
      title: '🐺 Ma Sói — Werewolf',
      description: 'Browser-based host tool for the Werewolf party game with private role reveals, button selection, and full night/day automation.',
      href: '/side-projects/werewolf',
      tags: ['Game', 'Interactive', 'Vietnamese'],
    },
  ]

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6">
      <main className="max-w-4xl mx-auto">
        <div className="mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Resume
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">
            Side <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Coding Projects</span>
          </h1>
          <p className="text-white/50 text-lg">Fun projects and experiments built for learning and entertainment.</p>
        </div>

        <div className="grid gap-4">
          {projects.map((project) => (
            <Link key={project.href} href={project.href} className="glass-card rounded-2xl p-6 sm:p-8 group block">
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{project.title}</h2>
                <svg className="w-5 h-5 text-white/30 group-hover:text-blue-400 transition-colors shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
              <p className="text-white/60 text-sm mb-4">{project.description}</p>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 text-xs font-medium bg-blue-500/10 text-blue-300 rounded-full border border-blue-400/20">
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
