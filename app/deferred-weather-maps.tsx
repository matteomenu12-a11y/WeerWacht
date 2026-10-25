'use client';
import {lazy,Suspense,ComponentProps} from 'react';
import type WeatherMapsType from './weather-maps';
const WeatherMaps=lazy(()=>import('./weather-maps'));

// Mount immediately: downloading the complete forecast must not depend on scroll.
export default function DeferredWeatherMaps(props:ComponentProps<typeof WeatherMapsType>){
 return <Suspense fallback={<section id="weerkaarten" className="map-deferred-placeholder"><span className="eyebrow">BEKIJK HET GROTER</span><h2>Het weer beweegt<span className="brand-dot">.</span></h2><p>De kaart en toekomstige uurbeelden worden alvast voorbereid…</p></section>}><WeatherMaps {...props}/></Suspense>;
}
