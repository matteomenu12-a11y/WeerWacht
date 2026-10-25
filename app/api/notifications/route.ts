import {identity,json,sameOrigin} from '@/lib/server';
import {supabaseServer} from '@/lib/supabase-server';
import {DEFAULT_NOTIFICATIONS,validatePreferences,validPushSubscription} from '@/lib/notification-rules';
import {pushConfiguration,subscriptionId,sendWeatherPush,checkWeatherNotifications} from '@/lib/push-server';
export async function GET(){const config=pushConfiguration(),user=await identity();if(!user)return json({...config,user:null,preferences:DEFAULT_NOTIFICATIONS});
 try{const db=await supabaseServer(),[saved,subs]=await Promise.all([
 db.from('notification_settings').select('preferences').eq('user_id',user.userId).maybeSingle(),
 db.from('push_subscriptions').select('id',{count:'exact',head:true}).eq('user_id',user.userId)]);
 if(saved.error||subs.error)throw Error('Database');
 return json({...config,user:{name:user.displayName,isAdmin:user.isAdmin},preferences:saved.data?JSON.parse(saved.data.preferences):DEFAULT_NOTIFICATIONS,devices:subs.count||0,lastCheck:null});}
 catch{return json({error:'Meldingsinstellingen zijn tijdelijk niet beschikbaar.'},503);}}
export async function PUT(request:Request){if(!sameOrigin(request))return json({error:'Ongeldig verzoek.'},403);const user=await identity();if(!user)return json({error:'Log eerst in.'},401);
 try{const prefs=validatePreferences(await request.json()),row={user_id:user.userId,preferences:JSON.stringify(prefs),updated_at:new Date().toISOString()};
 const {error}=await (await supabaseServer()).from('notification_settings').upsert(row,{onConflict:'user_id'});
 if(error)throw error;return json({ok:true,preferences:prefs});}catch(e:any){return json({error:e.message||'Opslaan mislukt.'},400);}}
export async function POST(request:Request){
 if(!sameOrigin(request))return json({error:'Ongeldig verzoek.'},403);const user=await identity();if(!user)return json({error:'Log eerst in.'},401);
 if(!pushConfiguration().serverReady)return json({error:'De pushsleutels moeten nog door de beheerder worden ingesteld.'},503);
 try{if(Number(request.headers.get('content-length'))>10000)return json({error:'Verzoek te groot.'},413);const body:any=await request.json(),db=await supabaseServer();
 if(body.action==='check')return json(await checkWeatherNotifications(user.userId));
 if(!validPushSubscription(body.subscription))return json({error:'Ongeldig pushabonnement.'},400);
 const clean={endpoint:body.subscription.endpoint,expirationTime:body.subscription.expirationTime||null,keys:{p256dh:body.subscription.keys.p256dh,auth:body.subscription.keys.auth}},id=await subscriptionId(clean.endpoint);
 const {data:existing}=await db.from('push_subscriptions').select('*').eq('id',id).maybeSingle();
 if(body.action==='subscribe'){
 const {data:prefs}=await db.from('notification_settings').select('user_id').eq('user_id',user.userId).maybeSingle();
 if(!prefs)return json({error:'Sla eerst je locaties en instellingen op.'},400);
 const {count}=await db.from('push_subscriptions').select('id',{count:'exact',head:true}).eq('user_id',user.userId);
 if((count||0)>=5&&!existing)return json({error:'Maximaal vijf toestellen per account.'},400);
 const {error}=await db.from('push_subscriptions').upsert({id,user_id:user.userId,subscription:JSON.stringify(clean),updated_at:new Date().toISOString()},{onConflict:'id'});
 if(error)return json({error:'Abonnement kon niet worden opgeslagen.'},503);return json({ok:true});}
 if(body.action==='test'&&existing){
 if(existing.last_test_at&&Date.now()-Date.parse(existing.last_test_at)<60000)return json({error:'Wacht een minuut voor een nieuwe testmelding.'},429);
 await db.from('push_subscriptions').update({last_test_at:new Date().toISOString()}).eq('id',id);
 const r=await sendWeatherPush(clean,{key:'test:'+Math.floor(Date.now()/60000),title:'WeerWacht Alerts',body:'Deze testmelding is op jouw verzoek verstuurd. Je pushverbinding werkt.',url:'/instellingen',expires:Date.now()+300000,source:'WeerWacht'});
 if(!r.ok){if([404,410].includes(r.status))await db.from('push_subscriptions').delete().eq('id',id);return json({error:'De pushservice heeft de melding niet geaccepteerd.'},502);}
 return json({ok:true,message:'Testmelding geaccepteerd door de pushservice.'});}
 return json({error:'Onbekende actie.'},400);
 }catch{return json({error:'De meldingsactie kon niet worden uitgevoerd.'},503);}
}
export async function DELETE(request:Request){if(!sameOrigin(request))return json({error:'Ongeldig verzoek.'},403);const user=await identity();if(!user)return json({error:'Log eerst in.'},401);
 try{const body:any=await request.json();if(typeof body.endpoint!=='string')return json({error:'Ongeldig abonnement.'},400);const id=await subscriptionId(body.endpoint);
 const {error}=await (await supabaseServer()).from('push_subscriptions').delete().eq('id',id).eq('user_id',user.userId);
 if(error)throw error;return json({ok:true});}catch{return json({error:'Uitschakelen mislukt.'},503);}}
