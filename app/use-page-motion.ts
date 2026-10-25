'use client';
import {useEffect} from 'react';

const selector='.section-heading,.metric,.weather-extra,.forecast-panel,.week-panel,.details-panel,.source-card,.warning-card,.warning-unavailable,.account-cta,.announcements article';
export function usePageMotion(){
 useEffect(()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const seen=new WeakSet<Element>();
  const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add('is-in');observer.unobserve(entry.target);}}},{threshold:.06,rootMargin:'0px 0px -24px 0px'});
  const prepare=(element:Element)=>{
   if(seen.has(element))return;seen.add(element);
   if(reduced.matches)return;
   const siblings=element.parentElement?.children;if(siblings)element instanceof HTMLElement&&element.style.setProperty('--reveal-delay',`${Math.min(Array.from(siblings).indexOf(element),4)*60}ms`);
   // Only hide elements below the fold. Already visible content never flashes out.
   if(element.getBoundingClientRect().top<innerHeight-24){element.classList.add('is-in');return;}
   element.classList.add('reveal-item');observer.observe(element);
  };
  const scan=(root:Element)=>{if(root.matches(selector))prepare(root);root.querySelectorAll(selector).forEach(prepare);};
  const main=document.querySelector('main');if(!main)return;scan(main);
  const additions=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node instanceof Element)scan(node);});
  additions.observe(main,{childList:true,subtree:true});
  const heroObserver=new IntersectionObserver(entries=>{document.documentElement.dataset.heroVisible=String(entries[0]?.isIntersecting??false);});
  const hero=document.querySelector('.hero');if(hero)heroObserver.observe(hero);
  const visibility=()=>{document.documentElement.dataset.pageHidden=String(document.hidden);};visibility();document.addEventListener('visibilitychange',visibility);
  const change=()=>{if(reduced.matches){main.querySelectorAll('.reveal-item').forEach(el=>el.classList.add('is-in'));observer.disconnect();}};
  reduced.addEventListener('change',change);
  return()=>{observer.disconnect();heroObserver.disconnect();additions.disconnect();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',change);delete document.documentElement.dataset.heroVisible;delete document.documentElement.dataset.pageHidden;};
 },[]);
}
