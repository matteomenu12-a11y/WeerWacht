import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
export async function GET(request: Request) {
  const client = await supabaseServer();
  await client.auth.signOut();
  const value = new URL(request.url).searchParams.get('return_to') || '/';
  const path = value.startsWith('/') && !value.startsWith('//') ? value : '/';
  return NextResponse.redirect(new URL(path, request.url));
}
