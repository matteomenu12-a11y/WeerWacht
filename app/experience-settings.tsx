'use client';
import {useEffect} from 'react';
export type Experience={theme:'dark'|'light'|'system';quality:'auto'|'full'|'lite'};
export const EXPERIENCE_DEFAULT:Experience={theme:'dark',quality:'auto'};
export function readExperience():Experience{try{return {...EXPERIENCE_DEFAULT,...JSON.parse(localStorage.getItem('ww-experience')||'{}')};}catch{return EXPERIENCE_DEFAULT;}}
export function saveExperience(value:Experience){localStorage.setItem('ww-experience',JSON.stringify(value));window.dispatchEvent(new CustomEvent('weerwacht:experience'));}
export default function ExperienceSettings(){useEffect(()=>{
 const motion=matchMedia('(prefers-reduced-motion: reduce)'),scheme=matchMedia('(prefers-color-scheme: light)'),mobile=matchMedia('(max-width: 760px)');
 let frames=0,last=0,total=0,raf=0,measuredSlow=false;
 const apply=()=>{const p=readExperience(),nav=navigator as Navigator&{deviceMemory?:number;connection?:{saveData?:boolean;effectiveType?:string}},low=motion.matches||nav.connection?.saveData||nav.deviceMemory!==undefined&&nav.deviceMemory<=4||navigator.hardwareConcurrency<=4||measuredSlow||nav.connection?.effectiveType==='2g';
 document.documentElement.dataset.theme=p.theme==='system'?(scheme.matches?'light':'dark'):p.theme;
 document.documentElement.dataset.quality=p.quality==='lite'||p.quality==='auto'&&low?'lite':p.quality==='auto'&&mobile.matches?'balanced':'full';
 document.documentElement.dataset.reducedMotion=String(motion.matches);window.dispatchEvent(new CustomEvent('weerwacht:quality'));
 };
 apply();const sample=(time:number)=>{if(last&&time-last<200){total+=time-last;frames++;}last=time;if(frames<45)raf=requestAnimationFrame(sample);else if(total/frames>29){measuredSlow=true;apply();}};raf=requestAnimationFrame(sample);
 const events=[motion,scheme,mobile];events.forEach(q=>q.addEventListener('change',apply));window.addEventListener('weerwacht:experience',apply);window.addEventListener('storage',apply);
 if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(()=>{});
 return()=>{cancelAnimationFrame(raf);events.forEach(q=>q.removeEventListener('change',apply));window.removeEventListener('weerwacht:experience',apply);window.removeEventListener('storage',apply);};
 },[]);return null;}
