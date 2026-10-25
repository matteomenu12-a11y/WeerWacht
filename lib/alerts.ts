export function xmlText(s:string){return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&').trim();}
function tag(s:string,n:string){return xmlText(s.match(new RegExp('<'+n+'(?:\\s[^>]*)?>([\\s\\S]*?)</'+n+'>'))?.[1]||'');}
const regions:Record<string,string>={'East Flanders':'Oost-Vlaanderen','West Flanders':'West-Vlaanderen','Antwerp':'Antwerpen','Liège':'Luik','Hainaut':'Henegouwen','Luxembourg':'Luxemburg','Namur':'Namen','Brabant':'Brabant','Limburg':'Limburg','Coast':'Kust','Coastal zone':'Kust'};
export function parseAlerts(xml:string,now=Date.now()){
  if(!/<feed[\s>]/.test(xml)||!/<updated>/.test(xml))throw Error('Ongeldige feed');
  const feedTime=tag(xml.split('<entry>')[0],'updated');
  if(!Number.isFinite(Date.parse(feedTime)))throw Error('Ongeldige feedtijd');
  const items=[...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(m=>{
    const s=m[1], severity=tag(s,'cap:severity'), event=tag(s,'cap:event');
    const level=severity==='Extreme'?4:severity==='Severe'?3:severity==='Moderate'?2:severity==='Minor'?1:0;
    const type=/thunder/i.test(event)?'Onweer':/rain/i.test(event)?'Regen':/wind/i.test(event)?'Wind':/snow|ice/i.test(event)?'Sneeuw of ijzel':/fog/i.test(event)?'Mist':/heat|high temperature/i.test(event)?'Hitte':/cold|low temperature/i.test(event)?'Koude':/flood/i.test(event)?'Overstroming':event;
    const area=tag(s,'cap:areaDesc');
    return {id:tag(s,'id'),area:regions[area]||area,geocode:s.match(/<valueName>(?:NUTS2|EMMA_ID)<\/valueName>\s*<value>([^<]+)<\/value>/)?.[1]||'',capURL:s.match(/<link type="application\/cap\+xml" href="(https:\/\/feeds\.meteoalarm\.org\/api\/v1\/warnings\/feeds-belgium\/[a-zA-Z0-9-]+)"/)?.[1]||'',event,type,level,severity,onset:tag(s,'cap:onset'),expires:tag(s,'cap:expires'),sent:tag(s,'cap:sent'),status:tag(s,'cap:status'),messageType:tag(s,'cap:message_type'),url:'https://www.meteo.be/nl/weer/waarschuwingen/weer'};
  }).filter(x=>x.status==='Actual'&&Number.isFinite(Date.parse(x.sent))&&Number.isFinite(Date.parse(x.onset))&&Date.parse(x.expires)>now&&Date.parse(x.onset)<now+48*3600000);
  // Keep the latest issuance for each province and phenomenon, including green
  // updates and cancellations before filtering colour. This prevents superseded
  // yellow/orange alerts from surviving an official downgrade.
  const latest=new Map<string,number>();
  for(const item of items){const key=item.area+'|'+item.type;latest.set(key,Math.max(latest.get(key)||0,Date.parse(item.sent)));}
  const current=items.filter(item=>Date.parse(item.sent)===latest.get(item.area+'|'+item.type)&&item.messageType!=='Cancel'&&item.level>=2);
  const unique=new Map<string,(typeof items)[number]>();
  for(const item of current){const key=item.area+'|'+item.type+'|'+item.onset;const old=unique.get(key);if(!old||Date.parse(item.sent)>Date.parse(old.sent))unique.set(key,item);}
  return {updatedAt:feedTime,stale:now-Date.parse(feedTime)>6*3600000,items:[...unique.values()].sort((a,b)=>b.level-a.level||a.area.localeCompare(b.area))};
}
// CAP is authoritative for timezone offsets. The legacy Atom feed can encode
// its onset/expiry differently; never silently relabel those times as verified.
export function parseCAPDetails(xml:string){
 if(!/<alert[\s>]/.test(xml)||tag(xml,'status')!=='Actual')throw Error('Ongeldige CAP-waarschuwing.');
 const infos=[...xml.matchAll(/<info>([\s\S]*?)<\/info>/g)].map(m=>m[1]),info=infos.find(s=>tag(s,'language')==='nl-BE')||infos[0];if(!info)throw Error('CAP-details ontbreken.');
 const onset=tag(info,'onset'),expires=tag(info,'expires'),sent=tag(xml,'sent');if(![onset,expires,sent].every(t=>Number.isFinite(Date.parse(t)))||Date.parse(expires)<=Date.parse(onset))throw Error('Ongeldige CAP-geldigheid.');
 return {onset,expires,sent,cancelled:tag(xml,'msgType')==='Cancel',headline:tag(info,'headline'),description:tag(info,'description'),timingVerified:true};
}
