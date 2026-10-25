import { supabaseServer } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export type ChatGPTUser = { userId: string; displayName: string; email: string; fullName: string | null };
export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const client = await supabaseServer();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user?.email) return null;
  const name = typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null;
  return { userId: user.id, email: user.email, fullName: name, displayName: name || user.email };
}
export async function requireChatGPTUser(returnTo: string): Promise<ChatGPTUser> {
  const user = await getChatGPTUser();
  if (!user) redirect(chatGPTSignInPath(returnTo));
  return user;
}
function safeReturn(value: string) {
  if (!value.startsWith('/') || value.startsWith('//')) return '/';
  try { const url = new URL(value, 'https://app.local'); return url.origin === 'https://app.local' ? url.pathname + url.search + url.hash : '/'; }
  catch { return '/'; }
}
export function chatGPTSignInPath(returnTo: string) { return '/login?return_to=' + encodeURIComponent(safeReturn(returnTo)); }
export function chatGPTSignOutPath(returnTo = '/') { return '/auth/signout?return_to=' + encodeURIComponent(safeReturn(returnTo)); }
