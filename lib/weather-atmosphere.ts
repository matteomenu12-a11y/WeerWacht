export type Atmosphere={mode:'neutral'|'sun'|'rain'|'storm'|'snow'|'fog'|'clouds';intensity:'light'|'medium'|'heavy';scene?:'day'|'sunset'|'night'};
type Current={weather_code?:number;is_day?:number;time?:number;precipitation?:number};
// Visual atmosphere is driven only by the selected location's current model
// interval. Missing/stale data never keeps the previous location's effect.
export function weatherAtmosphere(current?:Current|null,now=Date.now(),solar?:{sunrise?:number;sunset?:number}):Atmosphere{
 const neutral:Atmosphere={mode:'neutral',intensity:'light'};
 if(!current||!Number.isFinite(current.weather_code)||!Number.isFinite(current.time)||now-current.time!*1000>7200000||current.time!*1000-now>900000)return neutral;
 const scene=solar?.sunset&&Math.abs(now-solar.sunset*1000)<45*60000?'sunset':current.is_day===0?'night':'day';
 const code=current.weather_code!;
 if([95,96,99].includes(code))return {scene,mode:'storm',intensity:code===99?'heavy':'medium'};
 if([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code))return {scene,mode:'rain',intensity:[55,57,65,67,82].includes(code)?'heavy':[53,63,66,81].includes(code)?'medium':'light'};
 if([71,73,75,77,85,86].includes(code))return {scene,mode:'snow',intensity:[75,86].includes(code)?'heavy':'light'};
 if([45,48].includes(code))return {scene,mode:'fog',intensity:'light'};
 if([0,1,2].includes(code)&&current.is_day===1)return {scene,mode:'sun',intensity:code===2?'light':'medium'};
 return {mode:code===3?'clouds':'neutral',intensity:'light',scene};
}
