export default function Skills() {
  const languages = ['Python', 'C++', 'JavaScript', 'TypeScript', 'Kotlin', 'SQL']
  const technologies = ['Claude', 'GitHub Copilot', 'Advantest V93000', 'Eclipse', 'Visual Studio Code', 'Next.js', 'React', 'Node.js', 'Firebase', 'Supabase', 'Tailwind CSS', 'Vercel', 'Git/GitHub', 'Android Studio', 'Tkinter']
  const databases = ['MySQL', 'PostgreSQL', 'Firestore', 'Supabase']

  return (
    <section id="skills" className="animate-fade-in-up">
      <div className="glass-card rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Skills</h2>
        </div>
        <div className="space-y-5">
          <div className="bg-white/5 rounded-xl p-5 border border-white/5">
            <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Programming Languages</h3>
            <div className="flex flex-wrap gap-2">
              {languages.map((skill) => (
                <span key={skill} className="px-3 py-1.5 text-sm font-medium bg-blue-500/10 text-blue-300 rounded-lg border border-blue-400/20 hover:bg-blue-500/20 hover:scale-105 transition-all cursor-default">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-5 border border-white/5">
            <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Technologies & Tools</h3>
            <div className="flex flex-wrap gap-2">
              {technologies.map((skill) => (
                <span key={skill} className="px-3 py-1.5 text-sm font-medium bg-indigo-500/10 text-indigo-300 rounded-lg border border-indigo-400/20 hover:bg-indigo-500/20 hover:scale-105 transition-all cursor-default">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-5 border border-white/5">
            <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Databases</h3>
            <div className="flex flex-wrap gap-2">
              {databases.map((skill) => (
                <span key={skill} className="px-3 py-1.5 text-sm font-medium bg-emerald-500/10 text-emerald-300 rounded-lg border border-emerald-400/20 hover:bg-emerald-500/20 hover:scale-105 transition-all cursor-default">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 