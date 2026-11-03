'use client'

import { useState } from 'react'

export default function ContactForm() {
  const [status, setStatus] = useState('')

  return (
    <form
      action="https://formsubmit.co/thienan.guitarist@email.com"
      method="POST"
      onSubmit={() => setStatus('Sending message. A FormSubmit verification step may appear.')}
      className="space-y-5"
    >
      <input type="text" name="_honey" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contact-name" className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">Your Name</label>
          <input id="contact-name" type="text" name="name" autoComplete="name" maxLength={100} required placeholder="John Doe" className="w-full bg-black/40 text-white border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 outline-none transition-all placeholder:text-white/40" />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">Your Email</label>
          <input id="contact-email" type="email" name="email" autoComplete="email" maxLength={254} required placeholder="john@example.com" className="w-full bg-black/40 text-white border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 outline-none transition-all placeholder:text-white/40" />
        </div>
      </div>
      <div>
        <label htmlFor="contact-subject" className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">Subject</label>
        <input id="contact-subject" type="text" name="_subject" maxLength={150} placeholder="Booking inquiry, lesson request, etc." className="w-full bg-black/40 text-white border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 outline-none transition-all placeholder:text-white/40" />
      </div>
      <div>
        <label htmlFor="contact-message" className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">Message</label>
        <textarea id="contact-message" name="message" rows={5} minLength={10} maxLength={5000} required placeholder="Write your message here..." className="w-full bg-black/40 text-white border border-white/10 rounded-xl px-4 py-3 text-sm resize-y focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 outline-none transition-all placeholder:text-white/40" />
      </div>
      {status && <p role="status" className="text-center text-white/70 text-sm">{status}</p>}
      <p className="text-center text-white/60 text-xs">Your message is sent through FormSubmit. Their spam verification may appear after submission.</p>
      <div className="text-center">
        <button type="submit" className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 text-black font-semibold text-sm uppercase tracking-wider rounded-full hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/30 transition-all">
          Send Message
        </button>
      </div>
    </form>
  )
}
