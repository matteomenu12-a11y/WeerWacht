import test from 'node:test';
import assert from 'node:assert/strict';
import {FORECAST_PALETTE,recolorForecastPixels} from '../lib/forecast-palette.ts';
test('DWD source swatches retain exact hourly millimetre classes and alpha',()=>{
 assert.deepEqual(FORECAST_PALETTE.map(x=>[x.from,x.to]),[[.1,2],[2,5],[5,10],[10,15],[15,20],[20,25],[25,30],[30,40],[40,60],[60,80],[80,100],[100,130],[130,160],[160,Infinity]]);
 for(const entry of FORECAST_PALETTE){const rgba=[1,3,5].map(i=>parseInt(entry.source.slice(i,i+2),16));const p=new Uint8ClampedArray([...rgba,255,11,22,33,0,7,8,9,255]);assert.equal(recolorForecastPixels(p),1);assert.equal('#'+[...p.slice(0,3)].map(v=>v.toString(16).padStart(2,'0')).join(''),entry.display);assert.deepEqual([...p.slice(3)],[255,11,22,33,0,7,8,9,255]);}
});
