import {supabaseServer} from '@/lib/supabase-server';
import {NextResponse} from 'next/server';
export async function GET(request:Request){
 const url=new URL(request.url),code=url.searchParams.get('code');
 const returnTo=url.searchParams.get('return_to')||'/';
 const path=returnTo.startsWith('/')&&!returnTo.startsWith('//')?returnTo:'/';
 if(!code)return NextResponse.redirect(new URL('/login?error=invalid',url));
 const {error}=await (await supabaseServer()).auth.exchangeCodeForSession(code);
 if(error)return NextResponse.redirect(new URL('/login?error=invalid',url));
 return NextResponse.redirect(new URL(path,url));
}
