'use client';

import { useActionState, useEffect, useRef } from 'react';
import { sendContactMessage } from '@/app/actions/contact';

const initialState = { status: 'idle', message: '' };

export default function ContactForm() {
  const [state, formAction, pending] = useActionState(sendContactMessage, initialState);
  const formRef = useRef(null);

  useEffect(() => {
    if (state.status === 'success') formRef.current?.reset();
  }, [state]);

  return (
    <div className="contact-form-wrap">
      <p className="form-status">Kirim pesan untuk pertanyaan proyek atau kolaborasi.</p>
      <form ref={formRef} className="contact-form" action={formAction} aria-label="Formulir kontak">
        <label>Nama<input name="name" autoComplete="name" placeholder="Nama Anda" required minLength={2} maxLength={100} /></label>
        <label>Email<input name="email" type="email" autoComplete="email" placeholder="email@contoh.com" required maxLength={254} /></label>
        <label className="form-wide">Subjek<input name="subject" placeholder="Apa yang ingin dibahas?" required minLength={3} maxLength={180} /></label>
        <label className="form-wide">Pesan<textarea name="message" rows="4" placeholder="Tulis pesan Anda" required minLength={10} maxLength={4000} /></label>
        <label className="contact-honeypot" aria-hidden="true" tabIndex={-1}>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
        {state.message && <p className={`form-status ${state.status === 'error' ? 'form-status-error' : 'form-status-success'}`} role={state.status === 'error' ? 'alert' : 'status'}>{state.message}</p>}
        <button className="contact-submit" type="submit" disabled={pending}>{pending ? 'Sending…' : 'Send message'} <span aria-hidden="true">↗</span></button>
      </form>
    </div>
  );
}
