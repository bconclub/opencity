import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const base=process.env.QC_BASE||process.env.QC_URL||'http://127.0.0.1:4174';
const outDir='qc/drive-orientation';
await mkdir(outDir,{recursive:true});

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1280,height:800}});
await context.addInitScript(()=>{localStorage.setItem('opencity-player-name','QC Agent');});
const page=await context.newPage();
await page.route('**/multiplayer-client.js',route=>route.fulfill({contentType:'text/javascript',body:''}));
await page.route('**/local-cache.js*',route=>route.fulfill({contentType:'text/javascript',body:''}));
await page.goto(base,{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>window.cityBootReady,{timeout:120000});
await page.waitForSelector('#vehicle-picker [data-ride]:not([disabled])',{timeout:120000});

async function driveVehicle(ride,departure='Vidhana Soudha area'){
 await page.evaluate(()=>{localStorage.removeItem('opencity-default-ride');});
 await page.click(`#vehicle-picker [data-ride="${ride}"]`);
 await page.getByRole('button',{name:new RegExp(departure)}).click();
 await page.waitForFunction(()=>window.autoState?.().active,{timeout:60000});
 await page.keyboard.down('ArrowUp');
 const before=await page.evaluate(async()=>{const sample={wheel:0,speed:0,heading:0,vehicle:'',active:false,paused:false,maxSpeed:0};for(let i=0;i<35;i++){await new Promise(r=>setTimeout(r,100));const s=window.autoState();if(!s?.active)break;sample.wheel=s.wheelAngle;sample.speed=s.speed;sample.heading=s.heading;sample.vehicle=s.vehicleType;sample.active=s.active;sample.paused=s.paused;sample.maxSpeed=Math.max(sample.maxSpeed,Math.abs(s.speed));}return sample;});
 await page.keyboard.up('ArrowUp');
 await page.screenshot({path:`${outDir}/${ride}-driving.png`,fullPage:true});
 await page.evaluate(()=>document.getElementById('exit-auto')?.click());
 await page.waitForFunction(()=>!window.autoState?.().active,{timeout:30000});
 return before;
}

const cybertruck=await driveVehicle('cybertruck');
assert.ok(cybertruck.active&&!cybertruck.paused,`Cybertruck session active: ${JSON.stringify(cybertruck)}`);
assert.ok(Math.abs(cybertruck.wheel)>.1||cybertruck.maxSpeed>.5,`Cybertruck wheels or speed while driving: ${JSON.stringify(cybertruck)}`);
assert.ok(cybertruck.maxSpeed>2,`Cybertruck should reach drive speed on Vidhana roads: ${JSON.stringify(cybertruck)}`);
const cybercab=await driveVehicle('cybercab');
assert.ok(cybercab.maxSpeed>2,'Cybercab should reach drive speed with corrected orientation');
const lamps=await page.evaluate(async()=>{const T=await import('three');const {createBlenderVehicle}=await import('./blender-vehicle.js');const out={};for(const id of ['cybertruck','cybercab','kitt']){const model=createBlenderVehicle(T,id);await model.ready;let lampMeshes=0,tailNodes=0;model.group.traverse(o=>{if(o.isMesh&&o.material?.name==='Lamps')lampMeshes++;if(/tail|rear lamp/i.test(o.name||''))tailNodes++;});out[id]={lampMeshes,tailNodes,wheelAnimation:model.group.userData.wheelAnimation||'rigged',assetSource:model.group.userData.assetSource};}return out;});
const report={captured:new Date().toISOString(),cybertruck,cybercab,lamps,notes:'Cybercab Meshy mesh has joined static wheels; no separate rear lamp geometry. Authored Tail light bar uses Lamps material only.'};
await writeFile(`${outDir}/results.json`,JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
await browser.close();
