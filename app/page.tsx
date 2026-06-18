import Header from '@/app/components/Header'
import Objective from '@/app/components/Objective'
import Education from '@/app/components/Education'
import Experience from '@/app/components/Experience'
import Projects from '@/app/components/Projects'
import Skills from '@/app/components/Skills'
import SoftSkills from '@/app/components/SoftSkills'
import Activities from '@/app/components/Activities'


export default function Home() {
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6">
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

