export default function Projects() {
  return (
    <section id="projects" className="animate-fade-in-up">
      <div className="glass-card rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Projects</h2>
        </div>

        {/* Personal Projects */}
        <div>
          <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Personal Projects</h3>
          <div className="grid gap-4">
            <div className="bg-white/5 rounded-xl p-5 border border-white/5 hover:bg-white/[0.07] hover:border-blue-400/20 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">AI-Powered Video Content Analyser</h4>
                <a href="https://chat-with-youtubevideo.vercel.app/" target="_blank" rel="noopener noreferrer" className="shrink-0 ml-3 inline-flex items-center gap-1 text-xs font-medium text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-400/20 hover:bg-blue-500/20 transition-colors">
                  Live Demo
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              </div>
              <div className="space-y-1.5 text-sm text-white/60">
                <div className="flex items-start gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></span><p>Developed a full-stack Next.js web app that integrates AI-powered chatbots to analyze YouTube videos.</p></div>
                <div className="flex items-start gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></span><p>Implemented REST APIs & Firebase Authentication to allow user-specific analysis storage.</p></div>
                <div className="flex items-start gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></span><p>Deployed the platform on Vercel with a scalable serverless architecture.</p></div>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-5 border border-white/5 hover:bg-white/[0.07] hover:border-blue-400/20 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">My Resume & Guitar Websites</h4>
                <div className="flex gap-2 shrink-0 ml-3">
                  <a href="https://thienan.vercel.app/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-400/20 hover:bg-blue-500/20 transition-colors">
                    Resume
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                  <a href="https://nta105.github.io/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-400/20 hover:bg-blue-500/20 transition-colors">
                    Guitar
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                </div>
              </div>
              <div className="space-y-1.5 text-sm text-white/60">
                <div className="flex items-start gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></span><p>Designed and deployed a responsive online resume to showcase professional experience, hosted on Vercel for seamless accessibility.</p></div>
                <div className="flex items-start gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></span><p>Created a personal website highlighting guitar lessons and performances, deployed using GitHub Pages.</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 