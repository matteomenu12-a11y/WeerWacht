import {env} from 'cloudflare:workers';
import {weatherSnapshot} from '@/lib/weather-server';
import {json} from '@/lib/server';
export async function GET(request:Request){const q=new URL(request.url).searchParams;if(q.get('config')==='1')return json({delivery:(env as any).OPEN_METEO_API_KEY?'server':'browser'});const lat=Number(q.get('lat')),lon=Number(q.get('lon'));if(!q.has('lat')||!q.has('lon')||!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return json({error:'Ongeldige coördinaten.'},400);try{return json(await weatherSnapshot(lat,lon));}catch{return json({error:'De weerbron is tijdelijk niet bereikbaar. Probeer later opnieuw.'},503);}}
