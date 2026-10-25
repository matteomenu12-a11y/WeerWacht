'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

const client = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const returnTo = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('return_to') || '/' : '/';
  const destination = returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/';
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      if (!sent) {
        const { error } = await client.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: window.location.origin + '/auth/callback' } });
        if (error) throw error;
        setSent(true); setMessage('We hebben een inloglink of code naar je e-mailadres gestuurd.');
      } else {
        const { error } = await client.auth.verifyOtp({ email, token: code.trim(), type: 'email' });
        if (error) throw error;
        window.location.assign(destination);
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Inloggen is mislukt.'); }
    finally { setBusy(false); }
  }
  return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#0b1520',color:'white',padding:24}}>
    <form onSubmit={submit} style={{width:'min(100%,420px)',padding:32,border:'1px solid #ffffff33',borderRadius:24,background:'#ffffff10'}}>
      <a href="/" style={{color:'#a9d9f5'}}>← WeerWacht</a>
      <h1>Inloggen</h1><p>Ontvang een eenmalige code per e-mail om je plaatsen en meldingen te bewaren.</p>
      <label>E-mailadres<input required type="email" value={email} disabled={sent} onChange={e=>setEmail(e.target.value)} style={{display:'block',width:'100%',padding:12,margin:'8px 0 20px'}}/></label>
      {sent && <label>Code uit je e-mail<input required autoComplete="one-time-code" value={code} onChange={e=>setCode(e.target.value)} style={{display:'block',width:'100%',padding:12,margin:'8px 0 20px'}}/></label>}
      <button disabled={busy} style={{padding:'12px 20px',borderRadius:12,cursor:'pointer'}}>{busy?'Even wachten…':sent?'Inloggen':'Stuur code'}</button>
      {message && <p role="status">{message}</p>}
    </form>
  </main>;
}
