import test from 'node:test';
import assert from 'node:assert/strict';
import {parseKnmiCapabilities,knmiImageURL} from '../lib/knmi-nowcast.ts';
const now=Date.parse('2026-10-25T15:00:00Z');
const xml='<WMS_Capabilities><Layer><Name>Precipitation</Name><Dimension name="time" units="ISO8601">2026-10-25T14:55:00Z/2026-10-25T17:00:00Z/PT5M</Dimension><CRS>EPSG:3857</CRS></Layer></WMS_Capabilities>';
test('KNMI parser accepts five-minute forecast time steps',()=>{
 const data=parseKnmiCapabilities(xml,now);
 assert.equal(data.layer,'Precipitation');assert.equal(data.frames.length,26);
 assert.equal(data.projection,'EPSG:3857');assert.equal(data.frames[1],Date.parse('2026-10-25T15:00:00Z')/1000);
 const url=new URL(knmiImageURL(data,data.frames[1],{south:50.5,west:3.2,north:51.5,east:5.2},{width:720,height:500}));
 assert.equal(url.searchParams.get('DATASET'),'radar_forecast_2.0');
 assert.equal(url.searchParams.get('TIME'),'2026-10-25T15:00:00.000Z');
 assert.equal(url.searchParams.get('SRS'),'EPSG:3857');
});
test('KNMI parser rejects missing timestamps and invalid WMS data',()=>{
 assert.throws(()=>parseKnmiCapabilities('<html>invalid</html>',now));
 assert.throws(()=>parseKnmiCapabilities(xml.replace('2026-10-25T14:55:00Z/2026-10-25T17:00:00Z','2020-01-01T00:00:00Z/2020-01-01T02:00:00Z'),now));
});
