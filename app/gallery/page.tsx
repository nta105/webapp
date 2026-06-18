'use client'

import { useState } from 'react'
import Link from 'next/link'

const allGalleryImages = [
  'Hinh-Thien-An-1.jpg',
  '475161670_594799660138086_2675917611097618161_n.jpg',
  'DSCF8409.JPG',
  'Hinh-Thien-An-4.jpg',
  'IMG_1138.jpg',
  'IMG_1455.JPG',
  'IMG_3618.jpg',
  'Hinh-Thien-An-2.jpg',
  '500770185_31024596350473255_864268117096538412_n.jpg',
  '495579760_30749375237995369_5261623886874235774_n.jpg',
  'Hinh-Thien-An-3.jpg',
  'IMG_1359.JPG',
  '0BBA77A7-793D-47B1-A9B4-6A58883C3BAC.JPG',
  'Hinh-1.JPG',
  'IMG_3951.jpg',
  '475459797_594799503471435_3116515787604464607_n.jpg',
  'IMG_1362.JPG',
  'IMG_1360.JPG',
]

export default function GalleryPage() {
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightbox(`/guitar/gallery/${allGalleryImages[index]}`)
  }

  const prevImage = () => {
    const newIndex = (lightboxIndex - 1 + allGalleryImages.length) % allGalleryImages.length
    setLightboxIndex(newIndex)
    setLightbox(`/guitar/gallery/${allGalleryImages[newIndex]}`)
  }

  const nextImage = () => {
    const newIndex = (lightboxIndex + 1) % allGalleryImages.length
    setLightboxIndex(newIndex)
    setLightbox(`/guitar/gallery/${allGalleryImages[newIndex]}`)
  }

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 z-[-1]">
        <img src="/guitar/background.avif" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/65"></div>
      </div>

      {/* Hero */}
      <section className="min-h-[50vh] flex items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/50 to-black/75"></div>
        <div className="relative z-10 text-center px-4 py-20">
          <p className="text-sm font-medium tracking-[4px] uppercase text-amber-400 mb-4">Thien An Nguyen</p>
          <h1 className="text-4xl sm:text-6xl font-bold text-white mb-4">Gallery</h1>
          <p className="text-lg text-white/60 font-light">A collection of moments from performances, collaborations, and events</p>
        </div>
      </section>

      {/* Back nav */}
      <div className="sticky top-20 z-40 px-4 sm:px-6 mb-6">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors glass px-4 py-2 rounded-full">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Home
          </Link>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="columns-2 md:columns-3 gap-4">
          {allGalleryImages.map((img, i) => (
            <div
              key={i}
              className="break-inside-avoid mb-4 relative rounded-xl overflow-hidden group cursor-pointer"
              onClick={() => openLightbox(i)}
            >
              <img
                src={`/guitar/gallery/${img}`}
                alt="Gallery photo"
                className="w-full h-auto block group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 text-white/70 hover:text-white text-4xl font-light z-10 w-10 h-10 flex items-center justify-center">&times;</button>
          <button onClick={(e) => { e.stopPropagation(); prevImage() }} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-3xl z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <img src={lightbox} alt="Gallery photo" className="max-w-full max-h-[90vh] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
          <button onClick={(e) => { e.stopPropagation(); nextImage() }} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-3xl z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-sm tracking-widest">
            {lightboxIndex + 1} / {allGalleryImages.length}
          </div>
        </div>
      )}
    </div>
  )
}
