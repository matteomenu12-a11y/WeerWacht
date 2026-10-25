import {env} from 'cloudflare:workers';
import {timingSafeEqual} from 'node:crypto';
import {json} from '@/lib/server';
import {getDb} from '@/db';
import {notificationRuntime} from '@/db/schema';
import {checkWeatherNotifications} from '@/lib/push-server';
export async function POST(request:Request){const secret=(env as any).PUSH_CRON_SECRET,token=request.headers.get('authorization')?.replace(/^Bearer /,'')||'';if(!secret||token.length!==secret.length||!timingSafeEqual(Buffer.from(token),Buffer.from(secret)))return json({error:'Niet geautoriseerd.'},401);try{const result=await checkWeatherNotifications();const row={key:'last-cron',value:new Date().toISOString(),updatedAt:new Date().toISOString()};await getDb().insert(notificationRuntime).values(row).onConflictDoUpdate({target:notificationRuntime.key,set:row});return json(result);}catch{return json({error:'Controle tijdelijk mislukt.'},503);}}
