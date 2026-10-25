import {getDb} from '@/db';
import {profiles} from '@/db/schema';
import {eq} from 'drizzle-orm';
import {identity,json,sameOrigin} from '@/lib/server';
export async function GET(){
 const user=await identity();if(!user)return json({user:null});
 try{const [profile]=await getDb().select().from(profiles).where(eq(profiles.userId,user.userId));return json({user:{name:profile?.displayName||user.fullName||user.email.split('@')[0],email:user.email,isAdmin:user.isAdmin},preferences:profile?JSON.parse(profile.preferences):{favorites:[],home:null}});}catch{return json({error:'Je accountgegevens zijn tijdelijk niet beschikbaar.'},503);}
}
function location(p:any){return p&&typeof p.name==='string'&&p.name.length<=100&&typeof p.lat==='number'&&typeof p.lon==='number'&&Number.isFinite(p.lat)&&Number.isFinite(p.lon)&&Math.abs(p.lat)<=90&&Math.abs(p.lon)<=180?{name:p.name,lat:p.lat,lon:p.lon,region:String(p.region||'').slice(0,100),country:String(p.country||'').slice(0,100),countryCode:String(p.countryCode||'').slice(0,3)}:null;}
export async function PUT(request:Request){
 if(!sameOrigin(request))return json({error:'Ongeldig verzoek.'},403);
 const user=await identity();if(!user)return json({error:'Log eerst in.'},401);
 try{
  const body=await request.json() as any;
  if(typeof body.name!=='string'||!body.name.trim()||body.name.length>60||!Array.isArray(body.favorites)||body.favorites.length>12)return json({error:'Controleer je naam en locaties (maximaal 12).'},400);
  const fav=body.favorites.map(location);const home=body.home?location(body.home):null;
  if(fav.some((x:any)=>!x)||(body.home&&!home))return json({error:'Ongeldige locatie.'},400);
  const row={userId:user.userId,displayName:body.name.trim(),preferences:JSON.stringify({favorites:fav,home}),updatedAt:new Date().toISOString()};
  await getDb().insert(profiles).values(row).onConflictDoUpdate({target:profiles.userId,set:row});return json({ok:true});
 }catch{return json({error:'Opslaan is niet gelukt. Probeer het opnieuw.'},503);}
}
