export default function Objective() {
  return (
    <section id="objective" className="animate-fade-in-up">
      <div className="glass-card rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Executive Summary</h2>
        </div>
        <div className="bg-white/5 rounded-xl p-5 border border-white/5">
          <p className="text-white/70 leading-relaxed text-[15px]">
            Semiconductor Engineer with hands-on experience in integrated voltage regulator (IVR) product engineering, hardware
            qualification, reliability testing, and automated test development for AI data-center power applications. Currently an
            Associate Engineer, System Applications at Analog Devices, specializing in IVR product qualification (HTOL, ESD, and
            latch-up testing) and end-to-end ATE test program development. Holds a B.S. in Computer Science with a 3.955 GPA,
            bringing strong C++ and Python programming skills to semiconductor testing, automation, and engineering workflows.
          </p>
        </div>
      </div>
    </section>
  )
} 