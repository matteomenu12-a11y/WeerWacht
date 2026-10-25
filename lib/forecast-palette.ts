/**
 * DWD ICON-EU TOTPREC01H default GetLegendGraphic, sampled 2026-10-24.
 * The interval edges (mm in one hour) and RGBA color classes are the source's.
 * Display colors change only appearance; no model values are recalculated.
 */
export const FORECAST_PALETTE = [
 {from:0.1,to:2,source:'#c0c0c0',display:'#8ccdf4'},
 {from:2,to:5,source:'#fefec0',display:'#4ca8ee'},
 {from:5,to:10,source:'#fefe5b',display:'#207cc9'},
 {from:10,to:15,source:'#cff200',display:'#37b582'},
 {from:15,to:20,source:'#a0d625',display:'#75cb65'},
 {from:20,to:25,source:'#36c969',display:'#f1cf5b'},
 {from:25,to:30,source:'#00d7d7',display:'#f5a84e'},
 {from:30,to:40,source:'#00a6dd',display:'#ed794a'},
 {from:40,to:60,source:'#0000fe',display:'#dd5367'},
 {from:60,to:80,source:'#9730c2',display:'#c54a83'},
 {from:80,to:100,source:'#d926c7',display:'#a9539f'},
 {from:100,to:130,source:'#fe0000',display:'#9250a9'},
 {from:130,to:160,source:'#a00000',display:'#7948ad'},
 {from:160,to:Infinity,source:'#606060',display:'#ecdafa'},
] as const;
const key=(r:number,g:number,b:number)=>(r<<16)|(g<<8)|b;
const color=(hex:string)=>Number.parseInt(hex.slice(1),16);
const sourceToDisplay=new Map(FORECAST_PALETTE.map(entry=>[color(entry.source),color(entry.display)]));
/** Transparent/no-data and unrecognised source pixels stay untouched. */
export function recolorForecastPixels(pixels:Uint8ClampedArray){let changed=0;
 for(let i=0;i<pixels.length;i+=4){if(!pixels[i+3])continue;
  const output=sourceToDisplay.get(key(pixels[i],pixels[i+1],pixels[i+2]));
  if(output===undefined)continue;
  pixels[i]=output>>16;pixels[i+1]=(output>>8)&255;pixels[i+2]=output&255;changed++;
 }return changed;
}
export async function recolorForecastImage(source:HTMLImageElement):Promise<HTMLImageElement>{
 const canvas=document.createElement('canvas');canvas.width=source.naturalWidth;canvas.height=source.naturalHeight;
 const context=canvas.getContext('2d',{willReadFrequently:true});if(!context)throw Error('Kaartkleuren niet beschikbaar.');
 context.drawImage(source,0,0);const data=context.getImageData(0,0,canvas.width,canvas.height);
 recolorForecastPixels(data.data);context.putImageData(data,0,0);
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('Kaartbeeld niet beschikbaar.')),'image/png'));
 canvas.width=0;canvas.height=0;
 const url=URL.createObjectURL(blob),result=new Image();result.src=url;
 try{await result.decode();return result;}finally{URL.revokeObjectURL(url);}
}
