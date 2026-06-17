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
        <div className="mt-8 space-y-2">
          <Objective />
          <Education />
          <Skills />
          <Experience />
          <Projects />
          <Activities />
          <SoftSkills />
        </div>
        <footer className="mt-12 text-center text-sm text-gray-400 dark:text-gray-500 pb-8">
          <p>© {new Date().getFullYear()} Thien An Nguyen. Built with Next.js & Tailwind CSS.</p>
        </footer>
      </main>
    </div>
  )
}

