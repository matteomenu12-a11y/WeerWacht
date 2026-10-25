export type RadarFrame={time:number;path:string};
export type RadarData={host:string;frames:RadarFrame[];generated:number;fetchedAt:string;latest:number;stale:boolean};
export function parseRadar(raw:any,now=Date.now()):RadarData{
 if(!raw||typeof raw.host!=='string')throw Error('Radar metadata ontbreekt.');
 const u=new URL(raw.host);
 if(u.protocol!=='https:'||!(u.hostname==='rainviewer.com'||u.hostname.endsWith('.rainviewer.com'))||u.username||u.password||u.port)throw Error('Ongeldige radarbron.');
 if(!Array.isArray(raw.radar?.past))throw Error('Radarbeelden ontbreken.');
 const frames=raw.radar.past.filter((f:any)=>Number.isInteger(f.time)&&f.time>0&&f.time*1000<=now+60000&&typeof f.path==='string'&&/^\/v2\/radar\/[a-zA-Z0-9_-]+$/.test(f.path)).map((f:any)=>({time:f.time,path:f.path}));
 const unique=[...new Map<number,RadarFrame>(frames.map((f:RadarFrame)=>[f.time,f])).values()].sort((a,b)=>a.time-b.time).slice(-13);
 if(!unique.length||!Number.isFinite(raw.generated))throw Error('Geen geldige radarbeelden beschikbaar.');
 const latest=unique[unique.length-1].time;
 return {host:u.origin,frames:unique,generated:raw.generated,latest,stale:now-latest*1000>1800000,fetchedAt:new Date(now).toISOString()};
}
