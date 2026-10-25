/** KNMI pySTEPS 2.0: precipitation in five-minute accumulations (not measurements). */
export const KNMI_NOWCAST_WMS='https://anonymous.api.dataplatform.knmi.nl/wms/adaguc-server';
export const KNMI_NOWCAST_DATASET='radar_forecast_2.0';
export type KnmiNowcast={layer:string;frames:number[];fetchedAt:number;style:string;referenceTime?:string;projection:'EPSG:3857'|'EPSG:4326'};

function decodeXML(s:string){return s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');}
function attr(s:string,key:string){return new RegExp('\\b'+key+'=["\\']([^"\\']*)["\\']','i').exec(s)?.[1];}
function times(raw:string){
 const values=new Set<number>();
 for(const item of raw.split(',')){
  const parts=item.trim().split('/');
  if(parts.length===3){
   const start=Date.parse(parts[0]),end=Date.parse(parts[1]);
   const step=/^PT(?:(\\d+)H)?(?:(\\d+)M)?(?:(\\d+)S)?$/i.exec(parts[2]);
   const ms=step?((Number(step[1]||0)*3600+Number(step[2]||0)*60+Number(step[3]||0))*1000):0;
   if(Number.isFinite(start)&&Number.isFinite(end)&&ms>=60000&&ms<=3600000&&end-start<=7*86400000)
    for(let t=start,count=0;t<=end&&count<10000;t+=ms,count++)values.add(Math.floor(t/1000));
  }else{
   const t=Date.parse(item.trim());if(Number.isFinite(t))values.add(Math.floor(t/1000));
  }
 }
 return [...values].sort((a,b)=>a-b);
}
export function parseKnmiCapabilities(xml:string,now=Date.now()):KnmiNowcast{
 if(xml.length>4_000_000||!/<(?:\\w+:)?(?:WMS_Capabilities|WMT_MS_Capabilities)\\b/i.test(xml))
  throw Error('De KNMI-kaartdienst gaf geen geldige WMS-informatie.');
 const nameMatches=[...xml.matchAll(/<(?:\\w+:)?Name\\s*>([^<]+)<\\/(?:\\w+:)?Name>/gi)];
 const candidates:{layer:string;raw:string;score:number;area:string}[]=[];
 for(const match of nameMatches){
  const start=xml.lastIndexOf('<Layer',match.index);
  const end=xml.indexOf('</Layer>',match.index);
  const nsStart=xml.lastIndexOf('<wms:Layer',match.index);
  const begin=Math.max(start,nsStart);
  const endNs=xml.indexOf('</wms:Layer>',match.index);
  const stop=Math.min(...[end,endNs].filter(x=>x>=0));
  if(begin<0||!Number.isFinite(stop))continue;
  const area=xml.slice(begin,stop);
  const layer=decodeXML(match[1].trim());
  if(!/^[\\w.:/-]{1,150}$/.test(layer))continue;
  const dimensions=[...area.matchAll(/<(?:\\w+:)?(?:Dimension|Extent)\\b([^>]*)>([^<]+)<\\/(?:\\w+:)?(?:Dimension|Extent)>/gi)];
  const dimension=dimensions.find(d=>attr(d[1],'name')?.toLowerCase()==='time');
  if(!dimension)continue;
  const score=(/precipitation|rainfall|rain_rate|nowcast/i.test(layer)?20:0)+(/forecast/i.test(layer)?6:0)-(/quality|mask|uncertainty/i.test(layer)?25:0);
  candidates.push({layer,raw:dimension[2].trim(),score,area});
 }
 candidates.sort((a,b)=>b.score-a.score);
 const candidate=candidates[0];if(!candidate)throw Error('KNMI heeft geen bruikbare neerslag-nowcastlaag gepubliceerd.');
 const all=times(candidate.raw);
 const frames=all.filter(t=>t*1000>=now-10*60000&&t*1000<=now+125*60000).slice(0,26);
 if(!frames.length)throw Error('KNMI publiceert momenteel geen recente tijdstappen voor deze voorspelling.');
 // In WMS 1.1.1 the EPSG:4326 BBOX is lon,lat; EPSG:3857 uses metres.
 const projection=/EPSG:3857/i.test(candidate.area)||/EPSG:3857/i.test(xml)?'EPSG:3857':'EPSG:4326';
 const refDim=[...candidate.area.matchAll(/<(?:\\w+:)?(?:Dimension|Extent)\\b([^>]*)>([^<]+)<\\/(?:\\w+:)?(?:Dimension|Extent)>/gi)]
  .find(d=>/reference_time|forecast_reference_time/i.test(attr(d[1],'name')||''));
 const referenceTime=refDim?.[2]?.trim().split(',').at(-1);
 return {layer:candidate.layer,frames,fetchedAt:now,style:'',projection,...(referenceTime&&Number.isFinite(Date.parse(referenceTime))?{referenceTime}: {})};
}
export function knmiCapabilitiesURL(){
 const params=new URLSearchParams({DATASET:KNMI_NOWCAST_DATASET,SERVICE:'WMS',VERSION:'1.1.1',REQUEST:'GetCapabilities'});
 return KNMI_NOWCAST_WMS+'?'+params;
}
export function knmiImageURL(data:KnmiNowcast,time:number,bounds:{south:number;west:number;north:number;east:number},size:{width:number;height:number}){
 if(!data.frames.includes(time))throw Error('Dit tijdstip ontbreekt in de KNMI-voorspelling.');
 if(!Object.values(bounds).every(Number.isFinite)||bounds.south>=bounds.north||bounds.west>=bounds.east)
  throw Error('Ongeldig kaartgebied.');
 // EPSG:3857 uses the spherical Mercator meters expected by WMS.
 const project=(lat:number,lon:number)=>{
  const y=Math.max(-85.05112878,Math.min(85.05112878,lat))*Math.PI/180;
  return [6378137*lon*Math.PI/180,6378137*Math.log(Math.tan(Math.PI/4+y/2))];
 };
 const sw=data.projection==='EPSG:3857'?project(bounds.south,bounds.west):[bounds.west,bounds.south];
 const ne=data.projection==='EPSG:3857'?project(bounds.north,bounds.east):[bounds.east,bounds.north];
 const bbox=[...sw,...ne].map(n=>n.toFixed(data.projection==='EPSG:3857'?1:5)).join(',');
 const params=new URLSearchParams({DATASET:KNMI_NOWCAST_DATASET,SERVICE:'WMS',VERSION:'1.1.1',REQUEST:'GetMap',LAYERS:data.layer,STYLES:data.style,FORMAT:'image/png',TRANSPARENT:'TRUE',SRS:data.projection,BBOX:bbox,WIDTH:String(Math.max(64,Math.min(1200,Math.round(size.width)))),HEIGHT:String(Math.max(64,Math.min(1000,Math.round(size.height)))),TIME:new Date(time*1000).toISOString()});
 if(data.referenceTime)params.set('DIM_REFERENCE_TIME',data.referenceTime);
 return KNMI_NOWCAST_WMS+'?'+params;
}
export function knmiLegendURL(data:KnmiNowcast){
 const p=new URLSearchParams({DATASET:KNMI_NOWCAST_DATASET,SERVICE:'WMS',VERSION:'1.1.1',REQUEST:'GetLegendGraphic',FORMAT:'image/png',LAYER:data.layer});
 return KNMI_NOWCAST_WMS+'?'+p;
}
