'use client'

import Image from 'next/image'
import { useCallback, useState } from 'react'
import Link from 'next/link'
import PhotoLightbox from './PhotoLightbox'

const highlightImages = [
  '0BBA77A7-793D-47B1-A9B4-6A58883C3BAC.JPG',
  '495579760_30749375237995369_5261623886874235774_n.jpg',
  '500770185_31024596350473255_864268117096538412_n.jpg',
  '475161670_594799660138086_2675917611097618161_n.jpg',
  'IMG_1362.JPG',
  'Hinh-Thien-An-4.jpg',
]

export default function HomeGallery() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const closeLightbox = useCallback(() => setLightboxIndex(null), [])

  return (
    <>
      <div className="columns-2 md:columns-3 gap-3 mb-6">
        {highlightImages.map((img, index) => (
          <button
            key={img}
            type="button"
            className="break-inside-avoid mb-3 relative rounded-xl overflow-hidden group cursor-zoom-in block w-full"
            onClick={() => setLightboxIndex(index)}
            aria-label={`Open performance photo ${index + 1}`}
          >
            <Image
              src={`/guitar/gallery/${img}`}
              alt={`Performance photo ${index + 1}`}
              width={1200}
              height={900}
              sizes="(max-width: 768px) 50vw, 33vw"
              className="w-full h-auto block group-hover:scale-105 transition-transform duration-500"
            />
            <span className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </span>
          </button>
        ))}
      </div>
      <div className="text-center mt-4">
        <Link href="/gallery" className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white/70 rounded-full font-medium text-sm hover:bg-white/10 hover:text-white transition-all">
          View More Photos
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
      {lightboxIndex !== null && (
        <PhotoLightbox
          src={`/guitar/gallery/${highlightImages[lightboxIndex]}`}
          alt={`Performance photo ${lightboxIndex + 1}`}
          onClose={closeLightbox}
        />
      )}
    </>
  )
}
