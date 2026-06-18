export default function Activities() {
  return (
    <section id="activities" className="animate-fade-in-up">
      <div className="glass-card rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Activities</h2>
        </div>
        <div className="bg-white/5 rounded-xl p-5 border border-white/5 hover:bg-white/[0.07] transition-all">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1">
            <h3 className="text-lg font-semibold text-white">Google Developer Student Club, CSU East Bay</h3>
            <span className="text-sm text-white/50 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">Hayward, CA</span>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <p className="text-blue-400 font-medium">Active Member</p>
            <p className="text-sm text-white/40">Fall 2023 – Present</p>
          </div>
          <div className="space-y-2.5 text-sm text-white/70">
            <div className="flex items-start gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></span>
              <p>Collaborate on technical projects, enhancing skills through hands-on learning.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></span>
              <p>Help organize events and seminars aimed at engaging more students in technology.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 