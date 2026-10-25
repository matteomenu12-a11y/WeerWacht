'use client';
import {useEffect,useRef,useState,memo} from 'react';
import WeatherAtmosphere from './weather-atmosphere';
import type {Atmosphere} from '@/lib/weather-atmosphere';

function AmbientSky({atmosphere}:{atmosphere:Atmosphere}){
 const video=useRef<HTMLVideoElement>(null),mapFocused=useRef(false);
 const [source,setSource]=useState(''),[paused,setPaused]=useState(false),[ready,setReady]=useState(false),[covered,setCovered]=useState(false);
 useEffect(()=>{
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const connection=(navigator as Navigator&{connection?:{saveData?:boolean}}).connection;
  const change=()=>setPaused(reduce.matches||!!connection?.saveData);change();
  window.addEventListener('weerwacht:quality',change);
  reduce.addEventListener('change',change);
  return()=>{reduce.removeEventListener('change',change);window.removeEventListener('weerwacht:quality',change);};
 },[]);
 useEffect(()=>{
  if(paused||source)return;
  // Load after the first paint; the small poster remains visible until playback.
  const timer=setTimeout(()=>setSource(matchMedia('(max-width: 760px)').matches?'/media/weather-timelapse-mobile.mp4':'/media/weather-timelapse-desktop.mp4'),1800);
  return()=>clearTimeout(timer);
 },[paused,source]);
 useEffect(()=>{
  const sync=()=>{const element=video.current;if(!element)return;
   if(paused||document.hidden||mapFocused.current){element.pause();return;}
   if(source){element.muted=true;element.playbackRate=1.35;element.play().catch(()=>{/* Safari retries on the next direct interaction. */});}
  };
  const focus=(event:Event)=>{mapFocused.current=(event as CustomEvent<boolean>).detail;setCovered(mapFocused.current);sync();};
  document.addEventListener('visibilitychange',sync);document.addEventListener('pointerdown',sync,{passive:true});document.addEventListener('keydown',sync);window.addEventListener('weerwacht:map-focus',focus);sync();
  return()=>{document.removeEventListener('visibilitychange',sync);document.removeEventListener('pointerdown',sync);document.removeEventListener('keydown',sync);window.removeEventListener('weerwacht:map-focus',focus);};
 },[paused,source]);
 return <><div className={'ambient-sky '+(ready?'video-ready':'')+(paused||covered?' atmosphere-paused':'')} data-scene={atmosphere.scene||'day'} data-sky={atmosphere.mode} aria-hidden="true"><div className="sky-gradients"/><div className="sky-stars"/><video ref={video} src={source||undefined} autoPlay muted loop playsInline controls={false} controlsList="nofullscreen nodownload noremoteplayback" disableRemotePlayback preload="metadata" poster="/media/weather-timelapse-poster.webp" disablePictureInPicture tabIndex={-1} onPlaying={()=>setReady(true)}/><div className="ambient-shade"/><WeatherAtmosphere atmosphere={atmosphere}/></div></>;
}

export default memo(AmbientSky,(before,after)=>before.atmosphere.mode===after.atmosphere.mode&&before.atmosphere.intensity===after.atmosphere.intensity&&before.atmosphere.scene===after.atmosphere.scene);
