import {knmiCapabilitiesURL,parseKnmiCapabilities} from '@/lib/knmi-nowcast';
let cached:ReturnType<typeof parseKnmiCapabilities>|undefined;
export async function GET(){
 try{
  if(cached&&Date.now()-cached.fetchedAt<120_000)return Response.json(cached,{headers:{'Cache-Control':'public, max-age=60, s-maxage=120'}});
  const response=await fetch(knmiCapabilitiesURL(),{signal:AbortSignal.timeout(15000),cache:'no-store'});
  if(!response.ok)throw Error('KNMI WMS '+response.status);
  const length=Number(response.headers.get('content-length')||0);
  if(length>4_000_000)throw Error('KNMI metadata te groot');
  const xml=await response.text();
  const next=parseKnmiCapabilities(xml);
  cached=next;
  return Response.json(next,{headers:{'Cache-Control':'public, max-age=60, s-maxage=120'}});
 }catch(error){
  const detail=error instanceof Error?error.message:String(error);
  console.error('[KNMI nowcast] WMS capabilities ophalen of verwerken mislukt:',detail);
  return Response.json({error:'KNMI-nowcast tijdelijk niet bereikbaar. Kies eventueel DWD ICON-EU.',...(process.env.VERCEL_ENV==='preview'?{diagnostic:detail.slice(0,180)}:{})},{status:503,headers:{'Cache-Control':'no-store'}});
 }
}
