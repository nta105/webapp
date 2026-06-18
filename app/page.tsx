'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function GuitarPage() {
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)

  const videos = [
    {
      id: '3MVzg6YN5og',
      title: 'Live at San Jose Museum of Arts (2025)',
      description: 'Fingerstyle Elegance, An Evening with Thien An Nguyen',
      featured: true,
    },
    {
      id: '_WajxddbmLE',
      title: "Live at Chopsticks Alley Art's Anniversary Party",
      description: 'Guitar Percussive Fingerstyle Performance',
      featured: false,
    },
    {
      id: 'Ky-gH29grdw',
      title: "Don't Start Now | Fingerstyle Guitar Cover",
      description: '',
      featured: false,
    },
  ]

  return (
    <div className="min-h-screen relative">
      {/* Guitar page background */}
      <div className="fixed inset-0 z-[-1]">
        <img src="/guitar/background.avif" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/65 dark:bg-black/75"></div>
      </div>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60 dark:from-black/75 dark:via-black/50 dark:to-black/75"></div>
        <div className="relative z-10 text-center px-4 py-20">
          <p className="text-sm font-medium tracking-[4px] uppercase text-amber-400 mb-4 animate-fade-in-up">
            Professional Guitarist & Music Instructor
          </p>
          <h1 className="text-5xl sm:text-7xl font-bold mb-5 bg-gradient-to-br from-white to-amber-300 bg-clip-text text-transparent leading-tight animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            Thien An Nguyen
          </h1>
          <p className="text-lg text-white/70 font-light mb-10 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            Bringing soulful melodies to the Bay Area and beyond
          </p>
          <div className="flex gap-4 justify-center flex-wrap animate-fade-in-up" style={{ animationDelay: '0.45s' }}>
            <a href="#performances" className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 text-black font-semibold text-sm uppercase tracking-wider rounded-full hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/30 transition-all">
              Watch Performance
            </a>
            <a href="#contact" className="px-8 py-3.5 border-2 border-white/30 text-white font-semibold text-sm uppercase tracking-wider rounded-full hover:border-amber-400 hover:text-amber-400 transition-all">
              Get in Touch
            </a>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 animate-bounce">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 space-y-20">
        {/* About Section */}
        <section id="about" className="animate-fade-in-up">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">About Me</h2>
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto"></div>
          </div>
          <div className="glass-card rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="shrink-0">
                <Image
                  src="/guitar/profile.jpg"
                  alt="Thien An Nguyen"
                  width={280}
                  height={280}
                  className="rounded-2xl object-cover shadow-2xl"
                />
              </div>
              <div className="space-y-4 text-white/70 text-sm leading-relaxed">
                <p>Welcome! I&apos;m Thien An Nguyen, a self-taught guitarist based in the vibrant Bay Area.</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0"></span>
                    <span><strong className="text-white">Background:</strong> I began my musical journey nearly a decade ago, using platforms like YouTube to develop a deep mastery of the guitar.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0"></span>
                    <span><strong className="text-white">Teaching and Performing:</strong> I am passionate about enriching the local music scene through teaching and engaging live performances.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0"></span>
                    <span><strong className="text-white">Collaborations:</strong> I have had the opportunity to work with many renowned Vietnamese singers from Thúy Nga and Asia entertainment centers including Như Quỳnh, Trần Thái Hòa, Đan Nguyên, Dương Triệu Vũ, Don Hồ, Lâm Nhật Tiến, Lê Quốc Tuấn, Thiên Kim, Hồ Ngọc Hà, Bùi Anh Tuấn, Vũ Cát Tường, Võ Hạ Trâm, and more.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0"></span>
                    <span><strong className="text-white">Awards:</strong> First prizes at De Anza Got Talent, San Jose City College&apos;s Got Talent Show, and the Student Singing Contest at the Tet Festival in San Jose.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0"></span>
                    <span><strong className="text-white">Notable Performances:</strong> Featured guitarist at the San Jose Museum of Arts, Cantar Con Los Reyes program alongside Omar Alejandro, regular performer on the American Dream Show by MAC Network, and various downtown San Jose art gallery events.</span>
                  </li>
                </ul>
                <p>I look forward to continuing to share my musical journey with you.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Performances Section */}
        <section id="performances" className="animate-fade-in-up">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">Performances</h2>
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mb-3"></div>
            <p className="text-white/50 text-sm">Watch highlights from my live shows and recordings</p>
          </div>
          <div className="space-y-5">
            {videos.map((video) => (
              <div key={video.id} className={`glass-card rounded-2xl overflow-hidden ${video.featured ? 'ring-1 ring-amber-400/20' : ''}`}>
                <div className="relative aspect-video bg-black">
                  {playingVideo === video.id ? (
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div
                      className="absolute inset-0 cursor-pointer group"
                      onClick={() => setPlayingVideo(video.id)}
                    >
                      <img
                        src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-white font-semibold mb-1">{video.title}</h3>
                  {video.description && <p className="text-white/50 text-sm">{video.description}</p>}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <a href="https://www.youtube.com/nta105" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-red-600/20 border border-red-500/30 text-red-300 rounded-full font-medium text-sm hover:bg-red-600/30 transition-all">
              More on YouTube
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
          </div>
        </section>

        {/* Gallery Section */}
        <section id="gallery" className="animate-fade-in-up">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">Gallery</h2>
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mb-3"></div>
            <p className="text-white/50 text-sm">Moments from performances, collaborations, and events</p>
          </div>
          {/* Highlight Grid - masonry columns */}
          <div className="columns-2 md:columns-3 gap-3 mb-6">
            {[
              '0BBA77A7-793D-47B1-A9B4-6A58883C3BAC.JPG',
              '495579760_30749375237995369_5261623886874235774_n.jpg',
              '500770185_31024596350473255_864268117096538412_n.jpg',
              '475161670_594799660138086_2675917611097618161_n.jpg',
              'IMG_1362.JPG',
              'Hinh-Thien-An-4.jpg',
            ].map((img, i) => (
              <div key={i} className="break-inside-avoid mb-3 relative rounded-xl overflow-hidden group cursor-pointer" onClick={() => setLightbox(`/guitar/gallery/${img}`)}>
                <img src={`/guitar/gallery/${img}`} alt="Performance photo" className="w-full h-auto block group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <Link href="/gallery" className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white/70 rounded-full font-medium text-sm hover:bg-white/10 hover:text-white transition-all">
              View More Photos
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
          </div>
        </section>

        {/* Support Section */}
        <section id="support" className="animate-fade-in-up">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">Support Me & My Music</h2>
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mb-3"></div>
          </div>
          <p className="text-center text-white/60 text-sm mb-8 max-w-2xl mx-auto">
            Your support helps me continue to create and share my music with the world. If you&apos;d like to contribute, you can donate via Venmo or Zelle.
          </p>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="glass-card rounded-2xl p-6 text-center">
              <h3 className="text-amber-400 font-bold text-lg mb-3">Zelle</h3>
              <p className="text-white/70 text-sm">Thien An Nguyen</p>
              <p className="text-white font-bold text-lg mt-1">(408)-639 3430</p>
            </div>
            <div className="glass-card rounded-2xl p-6 text-center">
              <h3 className="text-amber-400 font-bold text-lg mb-3">Venmo</h3>
              <Image src="/guitar/venmo-qrc.png" alt="Venmo QR Code" width={200} height={200} className="mx-auto rounded-xl" />
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="animate-fade-in-up">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">Get in Touch</h2>
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mb-3"></div>
            <p className="text-white/50 text-sm">For guitar lessons, event bookings, and collaboration inquiries</p>
          </div>
          <div className="glass-card rounded-2xl p-6 sm:p-8">
            <form action="https://formsubmit.co/thienan.guitarist@email.com" method="POST" className="space-y-5">
              <input type="text" name="_honey" className="hidden" />
              <input type="hidden" name="_captcha" value="false" />
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">Your Name</label>
                  <input type="text" name="name" required placeholder="John Doe" className="w-full bg-black/40 text-white border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 outline-none transition-all placeholder:text-white/20" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">Your Email</label>
                  <input type="email" name="email" required placeholder="john@example.com" className="w-full bg-black/40 text-white border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 outline-none transition-all placeholder:text-white/20" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">Subject</label>
                <input type="text" name="_subject" placeholder="Booking inquiry, lesson request, etc." className="w-full bg-black/40 text-white border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 outline-none transition-all placeholder:text-white/20" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">Message</label>
                <textarea name="message" rows={5} required placeholder="Write your message here..." className="w-full bg-black/40 text-white border border-white/10 rounded-xl px-4 py-3 text-sm resize-y focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 outline-none transition-all placeholder:text-white/20" />
              </div>
              <div className="text-center">
                <button type="submit" className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 text-black font-semibold text-sm uppercase tracking-wider rounded-full hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/30 transition-all">
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Connect Section */}
        <section id="connect" className="animate-fade-in-up">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">Connect with Me</h2>
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto"></div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-5 text-center">
              <div className="text-amber-400 text-2xl mb-2">📞</div>
              <p className="text-white/70 text-sm">+1 (408) 639-3430</p>
            </div>
            <div className="glass-card rounded-2xl p-5 text-center">
              <div className="text-amber-400 text-2xl mb-2">✉️</div>
              <a href="mailto:thienan.guitarist@email.com" className="text-white/70 text-sm hover:text-amber-400 transition-colors">thienan.guitarist@email.com</a>
            </div>
            <a href="https://www.facebook.com/nguyenthienan95/" target="_blank" rel="noopener noreferrer" className="glass-card rounded-2xl p-5 text-center group block">
              <div className="text-blue-400 text-2xl mb-2">
                <svg className="w-7 h-7 mx-auto" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </div>
              <p className="text-white/70 text-sm group-hover:text-blue-400 transition-colors">@nguyenthienan95</p>
            </a>
            <a href="https://www.youtube.com/nta105" target="_blank" rel="noopener noreferrer" className="glass-card rounded-2xl p-5 text-center group block">
              <div className="text-red-400 text-2xl mb-2">
                <svg className="w-7 h-7 mx-auto" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </div>
              <p className="text-white/70 text-sm group-hover:text-red-400 transition-colors">@nta105</p>
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pt-10 pb-4">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8"></div>
          <p className="text-white font-medium mb-1">Thien An Nguyen</p>
          <p className="text-white/30 text-sm">&copy; {new Date().getFullYear()} All Rights Reserved.</p>
        </footer>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl font-light z-10">&times;</button>
          <img src={lightbox} alt="Gallery photo" className="max-w-full max-h-[90vh] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
