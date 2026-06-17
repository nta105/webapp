export default function Experience() {
  return (
    <section id="experience" className="mb-10 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Work Experience</h2>
      </div>
      <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Intuitive Surgical</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-2.5 py-0.5 rounded-full">Sunnyvale, CA</span>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <p className="text-blue-600 dark:text-blue-400 font-medium">Technician</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">July 2022 – July 2023</p>
        </div>
        <div className="space-y-2.5 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex items-start gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></span>
            <p>Assembled precision robotic components for the Da Vinci surgical system and Ion robotic platform, ensuring 100% compliance with quality and safety standards.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></span>
            <p>Conducted functional tests on 20+ devices per week, identifying defects early and reducing rework time by 15%.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></span>
            <p>Improved manufacturing procedure instructions by collaborating with software engineers, leading to a 10% reduction in assembly errors.</p>
          </div>
        </div>
      </div>
    </section>
  )
} 