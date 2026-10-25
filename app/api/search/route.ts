import {json,source} from '@/lib/server';
export async function GET(request:Request){
 const q=new URL(request.url).searchParams.get('q')?.trim();
 if(!q||q.length<2||q.length>100)return json({results:[]});
 try{
  const r=await source('https://geocoding-api.open-meteo.com/v1/search?'+new URLSearchParams({name:q,count:'8',language:'nl',format:'json'}),86400000,async r=>r.json() as Promise<any>);
  return json({results:(r.data.results||[]).map((p:any)=>({id:p.id,name:p.name,lat:p.latitude,lon:p.longitude,region:(p.country_code==='BE'?p.admin2||p.admin1:p.admin1)||'',country:p.country||'',countryCode:p.country_code||''}))});
 }catch{return json({error:'Locaties zoeken is tijdelijk niet beschikbaar.'},503);}
}
