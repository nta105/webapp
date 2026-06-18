export default function Experience() {
  return (
    <section id="experience" className="animate-fade-in-up">
      <div className="glass-card rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Work Experience</h2>
        </div>
        <div className="space-y-4">
          {/* Empower Semiconductor */}
          <div className="bg-white/5 rounded-xl p-5 border border-white/5 hover:bg-white/[0.07] transition-all">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1">
              <h3 className="text-lg font-semibold text-white">Empower Semiconductor</h3>
              <span className="text-sm text-white/50 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">Milpitas, CA</span>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1">
              <p className="text-blue-400 font-medium">Product & Test Engineer</p>
              <p className="text-sm text-white/40">May 2026 – Present</p>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
              <p className="text-blue-400 font-medium">Product & Test Engineering Intern</p>
              <p className="text-sm text-white/40">May 2025 – Dec 2025</p>
            </div>
            <div className="space-y-2.5 text-sm text-white/70">
              <div className="flex items-start gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></span>
                <p>Write and perform IC device testing using C++ scripts on Advantest V93000 with SmartTest, including functional validation and non-volatile memory (NVM) programming for production burn-in.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></span>
                <p>Develop and deploy a Python-based STDF-to-Excel conversion tool using pandas, openpyxl, and pystdf to streamline analysis of semiconductor test data.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></span>
                <p>Collaborated closely with test engineers to troubleshoot logs, refine test workflows, and support QA for production and R&D units.</p>
              </div>
            </div>
          </div>

          {/* Intuitive Surgical */}
          <div className="bg-white/5 rounded-xl p-5 border border-white/5 hover:bg-white/[0.07] transition-all">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1">
              <h3 className="text-lg font-semibold text-white">Intuitive Surgical</h3>
              <span className="text-sm text-white/50 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">Sunnyvale, CA</span>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
              <p className="text-blue-400 font-medium">Technician</p>
              <p className="text-sm text-white/40">July 2022 – July 2023</p>
            </div>
            <div className="space-y-2.5 text-sm text-white/70">
              <div className="flex items-start gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></span>
                <p>Assembled precision robotic components for the Da Vinci surgical system and Ion robotic platform, ensuring 100% compliance with quality and safety standards.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></span>
                <p>Conducted functional testing on 20+ robotic devices per week, reducing defect rates by 15%.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></span>
                <p>Improved technical documentation & manufacturing workflows, leading to a 10% reduction in errors.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></span>
                <p>Suggested process automation strategies to improve quality assurance and efficiency.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 