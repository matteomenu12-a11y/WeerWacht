import {json} from '@/lib/server';
import {supabaseServer} from '@/lib/supabase-server';
export async function GET(){if(!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)return json({items:[]});const {data,error}=await (await supabaseServer()).from('announcements').select('id,title,body,kind,expires_at').gt('expires_at',new Date().toISOString()).order('created_at',{ascending:false}).limit(10);return error?json({error:'Mededelingen konden niet worden geladen.'},503):json({items:(data||[]).map(({expires_at,...item})=>({...item,expiresAt:expires_at}))});}
