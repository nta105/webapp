export default function Education() {
  return (
    <section id="education" className="animate-fade-in-up">
      <div className="glass-card rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Education</h2>
        </div>
        <div className="bg-white/5 rounded-xl p-5 border border-white/5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1">
            <h3 className="text-lg font-semibold text-white">California State University, East Bay</h3>
            <span className="text-sm text-white/50 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">Hayward, CA</span>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <p className="text-blue-400 font-medium">Bachelor of Science in Computer Science</p>
            <p className="text-sm text-white/40">Expected December 2025</p>
          </div>
          <div className="space-y-2.5 text-sm text-white/70">
            <div className="flex items-start gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></span>
              <p><span className="font-medium text-white">Honors & Awards:</span> Dean&apos;s List (Fall 2023, Spring 2024, Fall 2024), CS Department Scholarship (2023-2024) | GPA: 3.94/4.0</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></span>
              <p><span className="font-medium text-white">Coursework:</span> Data Structures & Algorithms, Object-Oriented Programming, Software Engineering, Operating Systems, Database Management, Computer Networks, Artificial Intelligence</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></span>
              <p><span className="font-medium text-white">Involvement:</span> Google Developer Student Club – Organized events and collaborated on technical projects.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 