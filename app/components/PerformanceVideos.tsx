'use client'

import Image from 'next/image'
import { useState } from 'react'

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

export default function PerformanceVideos() {
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {videos.map((video) => (
        <div
          key={video.id}
          className={`glass-card rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all ${video.featured ? 'md:col-span-2' : ''}`}
        >
          <div className="relative aspect-video bg-black">
            {playingVideo === video.id ? (
              <iframe
                title={video.title}
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <button
                type="button"
                aria-label={`Play ${video.title}`}
                className="absolute inset-0 w-full h-full text-left group"
                onClick={() => setPlayingVideo(video.id)}
              >
                <Image
                  src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                  alt=""
                  fill
                  sizes={video.featured ? '(max-width: 768px) 100vw, 896px' : '(max-width: 768px) 100vw, 448px'}
                  className="object-cover"
                />
                <span className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <span className="w-16 h-16 rounded-full bg-amber-500/80 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/20">
                    <svg className="w-7 h-7 text-black ml-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </span>
              </button>
            )}
          </div>
          <div className="p-4">
            <h3 className="text-white font-semibold text-sm mb-1">{video.title}</h3>
            {video.description && <p className="text-white/50 text-xs">{video.description}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}
