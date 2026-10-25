import {source} from './server';
import {parseAlerts,parseCAPDetails} from './alerts';
const FEED='https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-belgium';
let pending:Promise<any>|undefined,cached:{at:number;data:any}|undefined;
export async function getBelgianAlerts(){
 if(cached&&Date.now()-cached.at<180000)return cached.data;if(pending)return pending;
 pending=(async()=>{try{const feed=await source(FEED,180000,r=>r.text()),parsed=parseAlerts(feed.data),items:any[]=[],jobs=[...parsed.items];let cursor=0,unconfirmed=0;const started=Date.now();
 const work=async()=>{while(cursor<jobs.length){const item=jobs[cursor++];if(Date.now()-started>9000){unconfirmed++;items.push({...item,timingVerified:false});continue;}if(!item.capURL){unconfirmed++;items.push({...item,timingVerified:false});continue;}try{const details=await source(item.capURL,86400000,r=>r.text()),cap=parseCAPDetails(details.data);if(details.stale)unconfirmed++;if(!cap.cancelled&&Date.parse(cap.expires)>Date.now())items.push({...item,...cap});}catch{unconfirmed++;items.push({...item,timingVerified:false});}}};await Promise.all([work(),work(),work()]);
 const data={...parsed,items:items.sort((a,b)=>b.level-a.level||a.area.localeCompare(b.area)),stale:parsed.stale||!!feed.stale||unconfirmed>0,fetchedAt:feed.fetchedAt,source:'KMI CAP via MeteoAlarm',country:'België',...(unconfirmed||feed.stale?{error:'Niet alle officiële details konden worden vernieuwd. Controleer de bron bij twijfel.'}:{})};cached={at:Date.now(),data};return data;
 }catch(e){if(cached)return {...cached.data,stale:true,error:'De officiële bron is onbereikbaar. Je ziet de laatst geldige gegevens.'};throw e;}})();try{return await pending;}finally{pending=undefined;}
}
