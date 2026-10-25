import webpush from 'web-push';
import {supabaseServer} from '@/lib/supabase-server';
import {weatherSnapshot} from './weather-server';
import {getBelgianAlerts} from './belgian-alerts';
import {evaluateNotifications,validatePreferences,validPushSubscription,type WeatherNotice} from './notification-rules';
export function pushConfiguration(){const e=process.env;return {serverReady:!!(e.PUSH_VAPID_PUBLIC_KEY&&e.PUSH_VAPID_PRIVATE_KEY&&e.PUSH_VAPID_SUBJECT),publicKey:e.PUSH_VAPID_PUBLIC_KEY||null,backgroundReady:false};}
export async function subscriptionId(endpoint:string){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(endpoint));return [...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');}
export async function sendWeatherPush(subscription:any,notice:WeatherNotice){
 const e=process.env;if(!pushConfiguration().serverReady)throw Error('De pushsleutels zijn nog niet geconfigureerd.');if(!validPushSubscription(subscription))throw Error('Ongeldige pushservice.');
 const details=webpush.generateRequestDetails(subscription,JSON.stringify({...notice,tag:notice.key}),{vapidDetails:{subject:e.PUSH_VAPID_SUBJECT!,publicKey:e.PUSH_VAPID_PUBLIC_KEY!,privateKey:e.PUSH_VAPID_PRIVATE_KEY!},TTL:Math.max(0,Math.min(3600,Math.floor((notice.expires-Date.now())/1000))),contentEncoding:'aes128gcm',urgency:notice.key.startsWith('kmi:')?'high':'normal'});
 return fetch(subscription.endpoint,{method:details.method,headers:details.headers as Record<string,string>,body:details.body?new Uint8Array(details.body).buffer:undefined,signal:AbortSignal.timeout(12000),redirect:'error'});
}
export async function checkWeatherNotifications(userId:string){
 if(!pushConfiguration().serverReady)return {checked:0,sent:0,skipped:'push_not_configured'};
 const db=await supabaseServer(),now=Date.now();let sent=0,checked=0,failed=0;
 const {data:rows,error}=await db.from('push_subscriptions').select('*').eq('user_id',userId).order('last_checked_at',{ascending:true,nullsFirst:true}).limit(5);
 if(error)throw error;
 const {data:saved}=await db.from('notification_settings').select('preferences').eq('user_id',userId).maybeSingle();
 if(!saved)return {checked:0,sent:0,skipped:'no_preferences'};
 const prefs=validatePreferences(JSON.parse(saved.preferences));
 let alerts:{items:any[];stale:boolean}={items:[],stale:true};try{alerts=await getBelgianAlerts();}catch{}
 const notices=new Map<string,WeatherNotice>();
 for(const place of prefs.locations){let weather:any=null;try{const r=await weatherSnapshot(place.lat,place.lon);if(!r.stale)weather=r.data;}catch{}for(const n of evaluateNotifications(prefs,place,weather,alerts,now))notices.set(n.key,n);}
 for(const sub of rows||[]){checked++;
  for(const notice of notices.values()){if(sent>=15)break;
   const id=sub.id+':'+notice.key;
   const {data:claimed,error:claimError}=await db.from('notification_deliveries').upsert({id,user_id:userId,subscription_id:sub.id,event_key:notice.key,created_at:new Date(now).toISOString()},{onConflict:'id',ignoreDuplicates:true}).select('id');
   if(claimError||!claimed?.length)continue;
   try{const response=await sendWeatherPush(JSON.parse(sub.subscription),notice);
    if(response.ok){sent++;await db.from('notification_deliveries').update({sent_at:new Date().toISOString()}).eq('id',id);}
    else{failed++;if(response.status===404||response.status===410){await db.from('push_subscriptions').delete().eq('id',sub.id);break;}await db.from('notification_deliveries').delete().eq('id',id);}
   }catch{failed++;await db.from('notification_deliveries').delete().eq('id',id);}
  }
  await db.from('push_subscriptions').update({last_checked_at:new Date(now).toISOString()}).eq('id',sub.id);
 }
 return {checked,sent,failed};
}
