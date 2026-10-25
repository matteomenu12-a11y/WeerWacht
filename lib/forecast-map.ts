export const FORECAST_WMS='https://maps.dwd.de/geoserver/wms';
export const FORECAST_LAYER='dwd:Icon-eu_reg00625_fd_sl_TOTPREC01H';
export type RainForecast={run:string;frames:number[];bounds:{south:number;west:number;north:number;east:number};fetchedAt:number};
let cached:RainForecast|undefined,inFlight:Promise<RainForecast>|undefined;
export function parseForecastCapabilities(xml:string,now=Date.now()):RainForecast{
 const at=xml.indexOf('<Name>'+FORECAST_LAYER+'</Name>');
 if(at<0)throw Error('De neerslaglaag ontbreekt bij de bron.');
 const start=xml.lastIndexOf('<Layer',at),end=xml.indexOf('</Layer>',at),layer=xml.slice(start,end);
 const dimensions=[...layer.matchAll(/<Dimension\b([^>]*)>([\s\S]*?)<\/Dimension>/g)];
 const attr=(text:string,key:string)=>new RegExp('\\b'+key+'="([^"]*)"').exec(text)?.[1];
 const time=dimensions.find(d=>attr(d[1],'name')==='time')?.[2].trim();
 const reference=dimensions.find(d=>attr(d[1],'name')==='REFERENCE_TIME'),run=reference&&attr(reference[1],'default');
 if(!time||!run)throw Error('De bron geeft geen geldige modeltijden terug.');
 const runTime=Date.parse(run);if(!Number.isFinite(runTime)||now-runTime>18*3600000||runTime-now>3600000)throw Error('De modelrun is mogelijk verouderd. Er worden geen vervangende beelden getoond.');
 const [first,last,step]=time.split('/');if(step!=='PT1H')throw Error('De tijdstappen van de bron zijn gewijzigd.');
 const min=Date.parse(first),max=Date.parse(last),frames:number[]=[];
 for(let t=Math.max(Math.ceil(now/3600000)*3600000,min);t<=Math.min(max,now+12*3600000);t+=3600000)if(t>now)frames.push(t/1000);
 if(!Number.isFinite(min)||!Number.isFinite(max)||!frames.length)throw Error('Er zijn geen toekomstige bronbeelden beschikbaar.');
 const box=[...layer.matchAll(/<BoundingBox\b([^>]*)\/>/g)].find(b=>attr(b[1],'CRS')==='EPSG:4326');
 if(!box)throw Error('De modeldekking ontbreekt bij de bron.');
 const bounds={south:Number(attr(box[1],'minx')),west:Number(attr(box[1],'miny')),north:Number(attr(box[1],'maxx')),east:Number(attr(box[1],'maxy'))};
 if(!Object.values(bounds).every(Number.isFinite)||bounds.south>=bounds.north||bounds.west>=bounds.east)throw Error('De modeldekking is ongeldig.');
 return {run,frames,bounds,fetchedAt:now};
}
export async function getRainForecast(){
 if(cached&&Date.now()-cached.fetchedAt<300000)return cached;
 if(inFlight)return inFlight;
 inFlight=(async()=>{const response=await fetch(FORECAST_WMS+'?service=WMS&version=1.3.0&request=GetCapabilities',{signal:AbortSignal.timeout(25000)});if(!response.ok)throw Error('De Duitse weerdienst is tijdelijk niet bereikbaar.');cached=parseForecastCapabilities(await response.text());return cached;})();
 try{return await inFlight;}finally{inFlight=undefined;}
}
export function forecastImageURL(forecast:RainForecast,time:number,bbox:string,width:number,height:number){
 if(!forecast.frames.includes(time))throw Error('Dit tijdstip staat niet in de bronverwachting.');
 const params=new URLSearchParams({service:'WMS',version:'1.1.1',request:'GetMap',layers:FORECAST_LAYER,styles:'',format:'image/png',transparent:'true',srs:'EPSG:3857',bbox,width:String(width),height:String(height),time:new Date(time*1000).toISOString(),dim_reference_time:forecast.run});
 return FORECAST_WMS+'?'+params;
}
