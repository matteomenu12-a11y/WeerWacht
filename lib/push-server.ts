import webpush from 'web-push';
import {env} from 'cloudflare:workers';
import {getDb} from '@/db';
import {notificationSettings,pushSubscriptions,notificationDeliveries,notificationRuntime} from '@/db/schema';
import {eq,lt,isNull,and,asc} from 'drizzle-orm';
import {source} from './server';
import {weatherSnapshot} from './weather-server';
import {getBelgianAlerts} from './belgian-alerts';
import {evaluateNotifications,validatePreferences,validPushSubscription,type WeatherNotice} from './notification-rules';
export function pushConfiguration(){const e=env as any;return {serverReady:!!(e.PUSH_VAPID_PUBLIC_KEY&&e.PUSH_VAPID_PRIVATE_KEY&&e.PUSH_VAPID_SUBJECT),publicKey:e.PUSH_VAPID_PUBLIC_KEY||null,backgroundReady:e.PUSH_SCHEDULE_ENABLED==='true'};}
export async function subscriptionId(endpoint:string){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(endpoint));return [...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');}
export async function sendWeatherPush(subscription:any,notice:WeatherNotice){
 const e=env as any;if(!pushConfiguration().serverReady)throw Error('De pushsleutels zijn nog niet geconfigureerd.');if(!validPushSubscription(subscription))throw Error('Ongeldige pushservice.');
 const details=webpush.generateRequestDetails(subscription,JSON.stringify({...notice,tag:notice.key}),{vapidDetails:{subject:e.PUSH_VAPID_SUBJECT,publicKey:e.PUSH_VAPID_PUBLIC_KEY,privateKey:e.PUSH_VAPID_PRIVATE_KEY},TTL:Math.max(0,Math.min(3600,Math.floor((notice.expires-Date.now())/1000))),contentEncoding:'aes128gcm',urgency:notice.key.startsWith('kmi:')?'high':'normal'});
 return fetch(subscription.endpoint,{method:details.method,headers:details.headers as Record<string,string>,body:details.body?new Uint8Array(details.body).buffer:undefined,signal:AbortSignal.timeout(12000),redirect:'error'});
}
let checking:Promise<any>|undefined;
export async function checkWeatherNotifications(onlyUser?:string){
 if(!pushConfiguration().serverReady)return {checked:0,sent:0,skipped:'push_not_configured'};
 if(checking)return {checked:0,sent:0,skipped:'check_in_progress'};
 checking=(async()=>{
  const db=getDb(),now=Date.now();let sent=0,checked=0,failed=0;
  await db.delete(notificationDeliveries).where(lt(notificationDeliveries.createdAt,new Date(now-7*86400000).toISOString()));
  await db.delete(notificationDeliveries).where(and(isNull(notificationDeliveries.sentAt),lt(notificationDeliveries.createdAt,new Date(now-15*60000).toISOString())));
  await db.delete(pushSubscriptions).where(lt(pushSubscriptions.updatedAt,new Date(now-90*86400000).toISOString()));
  const rows=await db.select().from(pushSubscriptions).where(onlyUser?eq(pushSubscriptions.userId,onlyUser):undefined).orderBy(asc(pushSubscriptions.lastCheckedAt)).limit(10);
  let alerts:{items:any[];stale:boolean}={items:[],stale:true};try{alerts=await getBelgianAlerts();}catch{}
  const byUser=new Map<string,typeof rows>();for(const sub of rows){const list=byUser.get(sub.userId)||[];list.push(sub);byUser.set(sub.userId,list);}
  for(const [userId,subscriptions] of byUser){const [saved]=await db.select().from(notificationSettings).where(eq(notificationSettings.userId,userId));if(!saved)continue;let prefs;try{prefs=validatePreferences(JSON.parse(saved.preferences));}catch{continue;}
   const notices=new Map<string,WeatherNotice>();for(const place of prefs.locations){let weather:any=null;try{const r=await weatherSnapshot(place.lat,place.lon);if(!r.stale)weather=r.data;}catch{}
    for(const n of evaluateNotifications(prefs,place,weather,alerts,now))notices.set(n.key,n);
   }
   for(const sub of subscriptions){checked++;for(const notice of notices.values()){if(sent>=15)break;
    const id=sub.id+':'+notice.key,claimed=await db.insert(notificationDeliveries).values({id,subscriptionId:sub.id,eventKey:notice.key,createdAt:new Date(now).toISOString()}).onConflictDoNothing().returning({id:notificationDeliveries.id});if(!claimed.length)continue;
    try{const response=await sendWeatherPush(JSON.parse(sub.subscription),notice);if(response.ok){sent++;await db.update(notificationDeliveries).set({sentAt:new Date().toISOString()}).where(eq(notificationDeliveries.id,id));}else{failed++;if(response.status===404||response.status===410){await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id,sub.id));break;}await db.delete(notificationDeliveries).where(eq(notificationDeliveries.id,id));}}catch{failed++;await db.delete(notificationDeliveries).where(eq(notificationDeliveries.id,id));}
   }await db.update(pushSubscriptions).set({lastCheckedAt:new Date(now).toISOString()}).where(eq(pushSubscriptions.id,sub.id));}
  }return {checked,sent,failed};
 })();try{return await checking;}finally{checking=undefined;}
}
