'use client';
import type {CSSProperties} from 'react';
import type {Atmosphere} from '@/lib/weather-atmosphere';

export default function WeatherAtmosphere({atmosphere}:{atmosphere:Atmosphere}){
 const {mode,intensity}=atmosphere,raining=mode==='rain'||mode==='storm';
 return <div key={mode+intensity} className={`ambient-weather weather-${mode} intensity-${intensity}`} data-weather-effect={mode} aria-hidden="true">
  {raining&&<><div className="rainfall">{Array.from({length:84},(_,i)=><i className="rain-streak" key={i} style={{left:`${(i*37.7)%115}%`,'--fall-time':`${.75+(i%7)*.13}s`,'--fall-delay':`${-(i*1.37)%5}s`,'--rain-opacity':.2+(i%4)*.12} as CSSProperties}/>)}</div><div className="glass-droplets">{Array.from({length:10},(_,i)=><i key={i} style={{left:`${i%2?94-i:3+i}%`,top:`${12+(i*17)%67}%`,animationDelay:`-${i*2.7}s`,animationDuration:`${11+i*1.7}s`}}/>)}</div></>}
  {mode==='sun'&&<div className="sunlight"><div className="sun-halo"/><i className="sunbeam beam-one"/><i className="sunbeam beam-two"/><i className="sunbeam beam-three"/><div className="sun-dust">{Array.from({length:9},(_,i)=><i key={i} style={{left:`${35+(i*13)%60}%`,top:`${8+(i*17)%60}%`,animationDelay:`-${i*1.8}s`}}/>)}</div></div>}
  {mode==='storm'&&<div className="storm-light"><div className="storm-glow"/><svg className="lightning-bolt bolt-one" viewBox="0 0 180 400" fill="none"><path d="m110 0-32 81 17 30-43 75 31 15-50 108 19-14-23 105"/><path d="m79 82-35 33-5 36m15 38 50 28 13 30"/></svg><svg className="lightning-bolt bolt-two" viewBox="0 0 180 400" fill="none"><path d="m110 0-21 58 8 27-39 78 22 13-45 85 13 6-25 69"/></svg></div>}
  {mode==='snow'&&<div className="snowfall">{Array.from({length:22},(_,i)=><i key={i} style={{left:`${(i*31.7)%100}%`,'--fall-time':`${8+(i%6)*1.7}s`,'--fall-delay':`${-i*1.9}s`,'--flake-size':`${2+i%4}px`} as CSSProperties}/>)}</div>}
  {mode==='fog'&&<div className="fog-banks"><i/><i/></div>}
 </div>;
}
