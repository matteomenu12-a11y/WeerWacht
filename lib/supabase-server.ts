import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function supabaseServer() {
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll() { return jar.getAll(); },
      setAll(changes) {
        try { changes.forEach(({ name, value, options }) => jar.set(name, value, options)); }
        catch { /* A Server Component cannot write cookies; route handlers can. */ }
      },
    },
  });
}
