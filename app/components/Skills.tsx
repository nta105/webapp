export default function Skills() {
  const languages = ['Python', 'C++', 'JavaScript', 'TypeScript', 'Kotlin', 'SQL']
  const technologies = ['Claude', 'GitHub Copilot', 'Advantest V93000', 'Eclipse', 'Visual Studio Code', 'Next.js', 'React', 'Node.js', 'Firebase', 'Supabase', 'Tailwind CSS', 'Vercel', 'Git/GitHub', 'Android Studio', 'Tkinter']
  const databases = ['MySQL', 'PostgreSQL', 'Firestore', 'Supabase']

  return (
    <section id="skills" className="mb-10 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Skills</h2>
      </div>
      <div className="space-y-5">
        <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Programming Languages</h3>
          <div className="flex flex-wrap gap-2">
            {languages.map((skill) => (
              <span key={skill} className="px-3 py-1.5 text-sm font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-100 dark:border-blue-800/50 hover:scale-105 transition-transform cursor-default">
                {skill}
              </span>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Technologies & Tools</h3>
          <div className="flex flex-wrap gap-2">
            {technologies.map((skill) => (
              <span key={skill} className="px-3 py-1.5 text-sm font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-100 dark:border-indigo-800/50 hover:scale-105 transition-transform cursor-default">
                {skill}
              </span>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Databases</h3>
          <div className="flex flex-wrap gap-2">
            {databases.map((skill) => (
              <span key={skill} className="px-3 py-1.5 text-sm font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-100 dark:border-emerald-800/50 hover:scale-105 transition-transform cursor-default">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
} 