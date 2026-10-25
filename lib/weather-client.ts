import {weatherParameters,validWeather,WEATHER_SOURCE} from './weather-data';
export type WeatherSnapshot={data:any;fetchedAt:string;source:string;type:string;stale:boolean;error?:string};
let delivery:Promise<boolean>|undefined;
async function serverDelivery(){if(!delivery)delivery=fetch('/api/weather?config=1').then(async r=>{if(!r.ok)throw Error('De bronconfiguratie is niet bereikbaar.');return (await r.json() as any).delivery==='server';}).catch(e=>{delivery=undefined;throw e;});return delivery;}
const inFlight=new Map<string,Promise<WeatherSnapshot>>(),cache=new Map<string,WeatherSnapshot>();
const key=(lat:number,lon:number)=>`ww-weather-v2:${lat.toFixed(3)},${lon.toFixed(3)}`;
export function getStoredWeather(lat:number,lon:number):WeatherSnapshot|null{const k=key(lat,lon),memory=cache.get(k);if(memory)return memory;try{const old=JSON.parse(localStorage.getItem(k)||'null');if(validWeather(old?.data)&&Date.now()-Date.parse(old.fetchedAt)<86400000)return {...old,stale:true};}catch{}return null;}
export async function getWeather(lat:number,lon:number){
 const k=key(lat,lon),old=getStoredWeather(lat,lon);
 if(old&&Date.now()-Date.parse(old.fetchedAt)<600000)return {...old,stale:Date.now()-old.data.current.time*1000>7200000};
 if(inFlight.has(k))return inFlight.get(k)!;
 const request=(async()=>{try{
  const useServer=await serverDelivery();
  // The free, non-commercial service supports browser CORS. Keep individual
  // visitors' normal quota separate from the shared hosting egress IP. A paid
  // customer key, when configured, is used exclusively by the server.
  const r=await fetch(useServer?'/api/weather?'+new URLSearchParams({lat:lat.toFixed(3),lon:lon.toFixed(3)}):'https://api.open-meteo.com/v1/forecast?'+weatherParameters(lat,lon),{signal:AbortSignal.timeout(16000)});
  if(!r.ok)throw Error(r.status===429?'De gratis bron heeft haar gebruikslimiet bereikt.':'De weerbron is tijdelijk niet bereikbaar.');
  const raw:any=await r.json(),snapshot=useServer?raw:{data:raw,fetchedAt:new Date().toISOString(),stale:false},data=snapshot.data;if(!validWeather(data))throw Error('De weerbron geeft onvolledige gegevens.');
  const value:WeatherSnapshot={data,fetchedAt:snapshot.fetchedAt,source:WEATHER_SOURCE,type:'model',stale:!!snapshot.stale||Date.now()-data.current.time*1000>7200000,...(snapshot.error?{error:snapshot.error}:{})};
  cache.set(k,value);while(cache.size>6)cache.delete(cache.keys().next().value!);
  try{localStorage.setItem(k,JSON.stringify(value));const saved=Object.keys(localStorage).filter(x=>x.startsWith('ww-weather-v2:')&&x!==k);for(const item of saved.slice(0,Math.max(0,saved.length-3)))localStorage.removeItem(item);}catch{}return value;
 }catch(e:any){if(old)return {...old,stale:true,error:(e?.message||'De bron is onbereikbaar.')+' Laatst bekende gegevens worden getoond.'};throw Error(e?.message||'Weerdata tijdelijk niet beschikbaar.');}})();
 inFlight.set(k,request);try{return await request;}finally{inFlight.delete(k);}
}
