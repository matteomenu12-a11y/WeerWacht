import {radarImage} from './radar-request-budget';
import type {RadarData,RadarFrame} from './radar';
export type RadarView={key:string;width:number;height:number;zoom:number;left:number;top:number;scale:number;tiles:{x:number;y:number;worldX:number}[]};
export function radarView(map:any):RadarView{
 const zoom=Math.min(7,Math.max(0,Math.round(map.getZoom())-1)),mapZoom=map.getZoom(),scale=2**(mapZoom-zoom),bounds=map.getPixelBounds(),size=map.getSize();
 const left=bounds.min.x/scale,top=bounds.min.y/scale,right=bounds.max.x/scale,bottom=bounds.max.y/scale,tiles:RadarView['tiles']=[],world=2**zoom;
 for(let x=Math.floor(left/256);x<=Math.floor((right-1)/256);x++)for(let y=Math.floor(top/256);y<=Math.floor((bottom-1)/256);y++)if(y>=0&&y<world)tiles.push({x:((x%world)+world)%world,y,worldX:x});
 return {key:[zoom,Math.round(left),Math.round(top),size.x,size.y].join(':'),width:size.x,height:size.y,zoom,left,top,scale,tiles};
}
export function radarURLs(data:RadarData,frame:RadarFrame,view:RadarView){return view.tiles.map(t=>`${data.host}${frame.path}/512/${view.zoom}/${t.x}/${t.y}/2/0_0.png`);}
const composites=new Map<string,HTMLImageElement>();
export async function prepareRadarFrame(data:RadarData,frame:RadarFrame,view:RadarView,priority:number,signal:AbortSignal){
 const key=frame.path+'|'+view.key;const hit=composites.get(key);if(hit)return hit;
 const images=await Promise.all(radarURLs(data,frame,view).map((url,i)=>{if(signal.aborted)throw new DOMException('Cancelled','AbortError');return radarImage(url,priority+i/100);}));
 if(signal.aborted)throw new DOMException('Cancelled','AbortError');
 const canvas=document.createElement('canvas'),ratio=Math.min(1,1100/view.width,650/view.height);canvas.width=Math.round(view.width*ratio);canvas.height=Math.round(view.height*ratio);
 const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('Deze browser kan de radar niet weergeven.');ctx.imageSmoothingEnabled=false;
 for(let i=0;i<images.length;i++){if(signal.aborted)throw new DOMException('Cancelled','AbortError');const tile=view.tiles[i];ctx.drawImage(images[i],(tile.worldX*256-view.left)*view.scale*ratio,(tile.y*256-view.top)*view.scale*ratio,256*view.scale*ratio,256*view.scale*ratio);await new Promise(resolve=>setTimeout(resolve,0));}
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Radarcompositie mislukt.')),'image/png'));canvas.width=0;canvas.height=0;
 if(signal.aborted)throw new DOMException('Cancelled','AbortError');
 const url=URL.createObjectURL(blob),image=new Image();image.src=url;try{await image.decode();}finally{URL.revokeObjectURL(url);}
 if(signal.aborted)throw new DOMException('Cancelled','AbortError');
 composites.set(key,image);while(composites.size>16)composites.delete(composites.keys().next().value!);return image;
}
let metadata:RadarData|undefined,request:Promise<RadarData>|undefined;
export async function getRadar(){
 const {parseRadar}=await import('./radar');
 if(metadata&&Date.now()-Date.parse(metadata.fetchedAt)<300000)return metadata;if(request)return request;
 request=(async()=>{try{const r=await fetch('https://api.rainviewer.com/public/weather-maps.json',{signal:AbortSignal.timeout(16000)});if(!r.ok)throw Error('Radarbron tijdelijk niet beschikbaar.');metadata=parseRadar(await r.json());try{localStorage.setItem('ww-radar-meta',JSON.stringify(metadata));}catch{}return metadata;}catch(e){if(!metadata)try{const old=JSON.parse(localStorage.getItem('ww-radar-meta')||'null');if(old&&Date.now()-Date.parse(old.fetchedAt)<3*3600000)metadata=parseRadar({host:old.host,generated:old.generated,radar:{past:old.frames}},Date.now());if(metadata){metadata.fetchedAt=old.fetchedAt;metadata.stale=true;}}catch{}if(metadata)return {...metadata,stale:true};throw e;}})();try{return await request;}finally{request=undefined;}
}
