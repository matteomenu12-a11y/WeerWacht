// Shared, bounded browser queue. Tile URLs are immutable source frames.
// The budget is deliberately below RainViewer's 100/IP/min limit. Several
// visitors sharing an IP can still encounter the provider limit; surface 429.
type Job={url:string;priority:number;run:()=>Promise<HTMLImageElement>;resolve:(image:HTMLImageElement)=>void;reject:(error:Error)=>void};
const cache=new Map<string,Promise<HTMLImageElement>>(),queue:Job[]=[];
const stamps:number[]=[];let running=0,timer:ReturnType<typeof setTimeout>|undefined;
const LIMIT=72,MAX_IMAGES=24;
function budget(now:number){let shared:number[]=[];try{shared=JSON.parse(localStorage.getItem('ww-radar-budget')||'[]');}catch{}return [...new Set([...shared,...stamps])].filter(t=>Number.isFinite(t)&&t>now-60000).sort((a,b)=>a-b);}
function flush(){clearTimeout(timer);timer=undefined;queue.sort((a,b)=>a.priority-b.priority);
 while(running<3&&queue.length){const now=Date.now(),recent=budget(now);if(recent.length>=LIMIT){timer=setTimeout(flush,Math.max(300,recent[0]+60300-now));return;}
 const job=queue.shift()!;stamps.splice(0,stamps.length,...recent,now);try{localStorage.setItem('ww-radar-budget',JSON.stringify(stamps));}catch{}
 running++;job.run().then(job.resolve,job.reject).finally(()=>{running--;flush();});
 }
}
function decode(blob:Blob){return new Promise<HTMLImageElement>((resolve,reject)=>{const url=URL.createObjectURL(blob),image=new Image();image.decoding='async';const done=()=>URL.revokeObjectURL(url);image.onload=()=>image.decode().then(()=>{done();resolve(image);},()=>{done();reject(Error('Radarbeeld kon niet worden gedecodeerd.'));});image.onerror=()=>{done();reject(Error('Ongeldig radarbeeld.'));};image.src=url;});}
export async function radarImage(url:string,priority=10):Promise<HTMLImageElement>{
 const hit=cache.get(url);if(hit){const job=queue.find(j=>j.url===url);if(job)job.priority=Math.min(priority,job.priority);return hit;}
 const task=(async()=>{
  let disk:Cache|undefined;try{disk=await caches.open('weerwacht-radar-v2');const old=await disk.match(url);if(old){if(Date.now()-Number(old.headers.get('x-ww-at'))<3*3600000)return decode(await old.blob());await disk.delete(url);}}catch{}
  return new Promise<HTMLImageElement>((resolve,reject)=>{queue.push({url,priority,resolve,reject,run:async()=>{
   const r=await fetch(url,{signal:AbortSignal.timeout(18000),mode:'cors'});if(r.status===429)throw Error('De radarbron heeft haar gedeelde IP-limiet bereikt. De geladen beelden blijven beschikbaar; probeer later opnieuw.');if(!r.ok)throw Error('Een radarbeeld is tijdelijk niet beschikbaar.');
   const blob=await r.blob();if(!blob.type.startsWith('image/'))throw Error('De radarbron leverde geen afbeelding.');
   if(disk){try{await disk.put(url,new Response(blob,{headers:{'Content-Type':blob.type,'x-ww-at':String(Date.now())}}));const keys=await disk.keys();for(const key of keys.slice(0,Math.max(0,keys.length-100)))await disk.delete(key);}catch{}}
   return decode(blob);
  }});flush();});
 })();cache.set(url,task);task.catch(()=>{if(cache.get(url)===task)cache.delete(url);});while(cache.size>MAX_IMAGES)cache.delete(cache.keys().next().value!);return task;
}
export function prioritizeRadar(urls:string[]){for(const job of queue){const at=urls.indexOf(job.url);if(at>=0)job.priority=Math.min(job.priority,at);}flush();}
// A pan/zoom discards queued work for old geography, while overlapping tiles
// and already running requests remain reusable. No aborted view consumes a
// second complete frame queue before the current view gets its first image.
export function retainRadarRequests(allowed:Set<string>){for(let i=queue.length-1;i>=0;i--){const job=queue[i];if(!allowed.has(job.url)){queue.splice(i,1);cache.delete(job.url);job.reject(new DOMException('Oude kaartweergave geannuleerd.','AbortError'));}}}
