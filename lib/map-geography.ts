import type * as Leaflet from 'leaflet';

// Public-domain Natural Earth geography is hosted with the app. Weather imagery
// remains live; this base needs neither a paid map key nor an external tile host.
export async function addGeography(L:typeof Leaflet,map:Leaflet.Map,isCurrent:()=>boolean){
 const response=await fetch('/maps/geography.json');
 if(!response.ok)throw new Error('Geography unavailable');
 const data=await response.json() as {countries:GeoJSON.FeatureCollection<GeoJSON.Geometry,{name:string;x:number;y:number}>;cities:{name:string;zoom:number;pop:number;xy:[number,number]}[]};if(!isCurrent())return;
 map.createPane('geography');map.getPane('geography')!.style.zIndex='190';
 map.createPane('country-borders');map.getPane('country-borders')!.style.zIndex='450';
 map.getPane('country-borders')!.style.pointerEvents='none';
 L.geoJSON(data.countries,{pane:'geography',interactive:false,style:{color:'#71817d',weight:1,fillColor:'#34433e',fillOpacity:1}}).addTo(map);
 L.geoJSON(data.countries,{pane:'country-borders',interactive:false,style:{color:'#c8d6c8',weight:1,opacity:.5,fill:false}}).addTo(map);
 const labels=L.layerGroup().addTo(map);
 const cities=[...data.cities].sort((a,b)=>b.pop-a.pop);
 const label=(name:string,lat:number,lon:number,country=false)=>{
  const node=document.createElement('span');node.textContent=name;node.className=country?'geography-country':'geography-city';
  L.marker([lat,lon],{interactive:false,keyboard:false,icon:L.divIcon({html:node,className:'geography-label',iconSize:[0,0]})}).addTo(labels);
 };
 const draw=()=>{labels.clearLayers();const zoom=map.getZoom(),bounds=map.getBounds(),occupied:{x:number;y:number}[]=[];
  if(zoom<6){for(const f of data.countries.features){const p=f.properties;if(bounds.contains([p.y,p.x]))label(p.name,p.y,p.x,true);}return;}
  for(const c of cities){
   const [lon,lat]=c.xy;if(c.zoom>zoom||!bounds.contains([lat,lon]))continue;const point=map.latLngToContainerPoint([lat,lon]);
   if(occupied.some(p=>Math.abs(p.x-point.x)<100&&Math.abs(p.y-point.y)<32))continue;
   occupied.push(point);label(c.name,lat,lon);
  }
 };
 let scheduled=0;const schedule=()=>{if(!scheduled)scheduled=requestAnimationFrame(()=>{scheduled=0;if(isCurrent())draw();});};
 map.on('moveend zoomend resize',schedule);map.once('unload',()=>cancelAnimationFrame(scheduled));draw();
 map.attributionControl.addAttribution('Kaart: <a href="https://www.naturalearthdata.com/" target="_blank">Natural Earth</a>');
}
