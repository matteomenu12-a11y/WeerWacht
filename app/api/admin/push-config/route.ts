import {env} from 'cloudflare:workers';
import {identity,json,sameOrigin} from '@/lib/server';
import {getDb} from '@/db';
import {notificationRuntime} from '@/db/schema';
import {eq} from 'drizzle-orm';
export async function POST(request:Request){if(!sameOrigin(request))return json({error:'Ongeldig verzoek.'},403);const user=await identity();if(!user?.isAdmin)return json({error:'Alleen de eigenaar kan deze configuratie bekijken.'},403);const e=env as any;const body:any=await request.json();
 if(body.action==='setup'){if(!e.PUSH_CRON_SECRET)return json({error:'De serverconfiguratie ontbreekt.'},503);return json({url:new URL('/api/notifications/check',request.url).href,authorization:'Bearer '+e.PUSH_CRON_SECRET,method:'POST',schedule:'Elke 5 minuten'});}
 if(body.action==='activate'){const [last]=await getDb().select().from(notificationRuntime).where(eq(notificationRuntime.key,'last-cron'));if(!last||Date.now()-Date.parse(last.value)>15*60000)return json({error:'Er is nog geen recente geautoriseerde achtergrondcontrole ontvangen. Koppel en test eerst de HTTPS-planning.'},400);const row={key:'scheduler-configured',value:'true',updatedAt:new Date().toISOString()};await getDb().insert(notificationRuntime).values(row).onConflictDoUpdate({target:notificationRuntime.key,set:row});return json({ok:true});}
 return json({error:'Onbekende actie.'},400);
}
