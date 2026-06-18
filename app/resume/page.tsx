import Header from '@/app/components/Header'
import Objective from '@/app/components/Objective'
import Education from '@/app/components/Education'
import Experience from '@/app/components/Experience'
import Projects from '@/app/components/Projects'
import Skills from '@/app/components/Skills'
import SoftSkills from '@/app/components/SoftSkills'
import Activities from '@/app/components/Activities'


export default function ResumePage() {
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 relative">
      {/* Resume background */}
      <div className="fixed inset-0 z-[-1]">
        <img src="/background.avif" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gray-950/80 dark:bg-gray-950/92"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/40 via-transparent to-indigo-950/50"></div>
      </div>
      <main className="max-w-4xl mx-auto">
        <Header />
        <div className="mt-10 space-y-6">
          <Objective />
          <Education />
          <Skills />
          <Experience />
          <Projects />
          <Activities />
          <SoftSkills />
        </div>
        <footer className="mt-16 text-center text-sm text-white/30 pb-8">
          <div className="section-line mb-6"></div>
          <p>© {new Date().getFullYear()} Thien An Nguyen. Built with Next.js & Tailwind CSS.</p>
        </footer>
      </main>
    </div>
  )
}
