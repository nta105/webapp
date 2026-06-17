export default function SoftSkills() {
  return (
    <section className="mb-10 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Soft Skills</h2>
      </div>
      <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm">
        <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex items-start gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></span>
            <p>Collaborated with a team of 5 students in the Google Developer Student Club to organize virtual events that engaged students on campus.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></span>
            <p>Communicated effectively with engineers and quality assurance teams at Intuitive Surgical to troubleshoot manufacturing issues.</p>
          </div>
        </div>
      </div>
    </section>
  )
} 