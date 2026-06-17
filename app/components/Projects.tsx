export default function Projects() {
  return (
    <section id="projects" className="mb-10 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h2>
      </div>

      {/* Personal Projects */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Personal Projects</h3>
        <div className="grid gap-4">
          <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700/50 transition-all group">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">AI-Powered Video Content Analyser</h4>
              <a href="https://chat-with-youtubevideo.vercel.app/" target="_blank" rel="noopener noreferrer" className="shrink-0 ml-3 inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                Live Demo
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            </div>
            <div className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex items-start gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></span><p>Built a web application that allows users to input a YouTube link and receive AI-generated analysis of the video content.</p></div>
              <div className="flex items-start gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></span><p>Integrated an AI-powered chatbot that enables users to ask questions about the video&apos;s content.</p></div>
              <div className="flex items-start gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></span><p>Implemented user authentication with Firebase, allowing users to save, edit, update, and delete their analyses.</p></div>
              <div className="flex items-start gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></span><p>Designed a responsive and intuitive UI using Tailwind CSS and deployed the platform on Vercel for seamless access.</p></div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700/50 transition-all group">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">My Resume Website</h4>
              <a href="https://thienan.vercel.app/" target="_blank" rel="noopener noreferrer" className="shrink-0 ml-3 inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                Live Demo
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            </div>
            <div className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex items-start gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></span><p>Designed and deployed a responsive online resume to showcase professional experience.</p></div>
              <div className="flex items-start gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></span><p>Hosted on Vercel for seamless accessibility.</p></div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700/50 transition-all group">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Guitar Teaching & Performance Website</h4>
              <a href="https://nta105.github.io/" target="_blank" rel="noopener noreferrer" className="shrink-0 ml-3 inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                Live Demo
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            </div>
            <div className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex items-start gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></span><p>Created a personal website highlighting guitar lessons and performances.</p></div>
              <div className="flex items-start gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></span><p>Deployed using GitHub Pages.</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* University Projects */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">University Projects</h3>
        <div className="grid gap-4">
          <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700/50 transition-all group">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Interactive Android Clicker Game</h4>
              <span className="shrink-0 ml-3 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-2.5 py-1 rounded-full">Spring 2024</span>
            </div>
            <div className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex items-start gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></span><p>Developed an interactive Android clicker game with Firebase integration for secure user authentication and data storage.</p></div>
              <div className="flex items-start gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></span><p>Designed an engaging UI with customized icons and smooth gameplay to enhance user experience.</p></div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700/50 transition-all group">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Task Manager</h4>
              <span className="shrink-0 ml-3 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-2.5 py-1 rounded-full">Fall 2023</span>
            </div>
            <div className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex items-start gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></span><p>Built a desktop application for task organization with an intuitive Graphical User Interface (GUI).</p></div>
              <div className="flex items-start gap-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></span><p>Implemented CRUD operations (Create, Read, Update, Delete) for task management.</p></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 