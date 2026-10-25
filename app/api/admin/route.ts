import {identity,json,sameOrigin} from '@/lib/server';
import {supabaseServer} from '@/lib/supabase-server';
const camel=(item:any)=>({id:item.id,title:item.title,body:item.body,kind:item.kind,expiresAt:item.expires_at,createdAt:item.created_at,authorId:item.author_id});
export async function GET(){const u=await identity();if(!u?.isAdmin)return json({error:'Geen toegang.'},403);
 try{const db=await supabaseServer();const [items,logs,users]=await Promise.all([
 db.from('announcements').select('*').order('created_at',{ascending:false}).limit(50),
 db.from('audit').select('*').order('created_at',{ascending:false}).limit(30),
 db.from('profiles').select('user_id',{count:'exact',head:true})]);
 if(items.error||logs.error||users.error)throw Error('Database');
 return json({items:(items.data||[]).map(camel),logs:(logs.data||[]).map(x=>({id:x.id,action:x.action,createdAt:x.created_at})),profiles:users.count||0});}
 catch{return json({error:'Beheergegevens konden niet worden geladen.'},503);}}
export async function POST(request:Request){if(!sameOrigin(request))return json({error:'Ongeldig verzoek.'},403);const u=await identity();if(!u?.isAdmin)return json({error:'Geen toegang.'},403);
 try{const b=await request.json() as any;if(typeof b.title!=='string'||!b.title.trim()||b.title.length>100||typeof b.body!=='string'||!b.body.trim()||b.body.length>1000||!['info','advice','maintenance'].includes(b.kind)||!Number.isFinite(b.hours)||b.hours<1||b.hours>168)return json({error:'Controleer alle velden. Geldigheid: 1 tot 168 uur.'},400);
 const db=await supabaseServer(),now=new Date().toISOString();
 const {error}=await db.from('announcements').insert({id:crypto.randomUUID(),title:b.title.trim(),body:b.body.trim(),kind:b.kind,created_at:now,expires_at:new Date(Date.now()+b.hours*3600000).toISOString(),author_id:u.userId});
 if(error)throw error;await db.from('audit').insert({id:crypto.randomUUID(),action:'Mededeling gepubliceerd',created_at:now});return json({ok:true});}
 catch{return json({error:'Publiceren is niet gelukt.'},503);}}
export async function DELETE(request:Request){if(!sameOrigin(request))return json({error:'Ongeldig verzoek.'},403);const u=await identity();if(!u?.isAdmin)return json({error:'Geen toegang.'},403);
 try{const b=await request.json() as any;if(typeof b.id!=='string'||b.id.length>60)return json({error:'Ongeldig ID.'},400);
 const db=await supabaseServer();const {error}=await db.from('announcements').delete().eq('id',b.id);if(error)throw error;
 await db.from('audit').insert({id:crypto.randomUUID(),action:'Mededeling verwijderd',created_at:new Date().toISOString()});return json({ok:true});}
 catch{return json({error:'Verwijderen is niet gelukt.'},503);}}
