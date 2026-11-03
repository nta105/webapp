'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'

type PhotoLightboxProps = {
  src: string
  alt: string
  onClose: () => void
  onPrevious?: () => void
  onNext?: () => void
  counter?: string
}

export default function PhotoLightbox({
  src,
  alt,
  onClose,
  onPrevious,
  onNext,
  counter,
}: PhotoLightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null

    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === 'ArrowLeft' && onPrevious) {
        onPrevious()
      } else if (event.key === 'ArrowRight' && onNext) {
        onNext()
      } else if (event.key === 'Tab') {
        const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        )
        if (!focusableElements?.length) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]
        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [onClose, onNext, onPrevious])

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      tabIndex={-1}
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        ref={closeButtonRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onClose()
        }}
        aria-label="Close photo"
        className="absolute top-4 right-4 text-white/70 hover:text-white text-4xl font-light z-10 w-10 h-10 flex items-center justify-center"
      >
        &times;
      </button>
      {onPrevious && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onPrevious()
          }}
          aria-label="Previous photo"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-3xl z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-all"
        >
          <span aria-hidden="true">&lsaquo;</span>
        </button>
      )}
      <Image
        src={src}
        alt={alt}
        width={1600}
        height={1200}
        sizes="100vw"
        className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg"
        onClick={(event) => event.stopPropagation()}
      />
      {onNext && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onNext()
          }}
          aria-label="Next photo"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-3xl z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-all"
        >
          <span aria-hidden="true">&rsaquo;</span>
        </button>
      )}
      {counter && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm tracking-widest" aria-live="polite">
          {counter}
        </div>
      )}
    </div>
  )
}
