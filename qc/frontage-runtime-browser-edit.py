from pathlib import Path
s=Path('qc/vidhana-passage-browser-v2.cjs').read_text()
s=s.replace('vidhana-passage-browser-v2-snapshot','frontage-runtime-browser-snapshot').replace('vidhana-passage-browser-v2-results','frontage-runtime-browser-results').replace('vidhana-passage-browser-v2-failure','frontage-runtime-browser-failure')
s=s.replace("await p.addInitScript(()=>{window.__passageArchitectureReady=new Promise(resolve=>{window.__resolvePassageArchitecture=resolve;});});",'')
s=s.replace('multiplayerState().connected&&window.__passageArchitecture','multiplayerState().connected&&window.districtState?.().loaded')
s=s.replace('architecture:window.__passageArchitecture','architecture:(await import("./district.js")).getDistrictArchitecture()',1)
s=s.replace("await driver.evaluate(()=>document.getElementById('pause-auto').click());await driver.screenshot({path:`qc/vidhana-passage-drive-${sign}.png`});", "await driver.screenshot({path:`qc/frontage-runtime-passage-${sign}.png`});await driver.evaluate(()=>document.getElementById('pause-auto').click());")
s=s.replace("await driver.evaluate(()=>document.getElementById('pause-auto').click());await driver.screenshot({path:`qc/vidhana-passage-stair-${entry.name}.png`});", "await driver.waitForFunction(()=>document.getElementById('resume-overlay').hidden);await driver.screenshot({path:`qc/frontage-runtime-stair-${entry.name}.png`});await driver.evaluate(()=>document.getElementById('pause-auto').click());")
start=s.index("await driver.evaluate(()=>{document.getElementById('pause-auto').click();setDomeOverview?.(false);});")
end=s.index('assert.deepEqual(errors,[]);',start)
s=s[:start]+"""
await driver.evaluate(()=>document.getElementById('exit-auto').click());
await driver.locator('[data-ride=helicopter]').click();await driver.locator('.departure-options button').first().click();
await driver.waitForFunction(()=>flightState()?.active&&window.__frontageHover);
await driver.evaluate(()=>startFlightTakeoff());await driver.waitForFunction(()=>flightState().phase==='flying',{},{timeout:30000});
const focus=await driver.evaluate(async()=>{
 const a=(await import('./district.js')).getDistrictArchitecture(),{toLngLat}=await import('./auto-roads.js'),center=a.domeUpdate.mappedCenter,s=a.stairPlacement,heading=Math.atan2(-s.outward[0],-s.outward[1])*180/Math.PI;
 const trials=[];
 for(const distance of [60,90,40])for(const height of [45,50,55,60,35,40,65])for(const shift of [12,18,6,24,0]){
  const point=toLngLat([center[0]+s.outward[0]*distance+s.tangent[0]*shift,center[1]+s.outward[1]*distance+s.tangent[1]*shift]);
  __frontageHover(point,heading,height);
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  const hit=pickDistrictFocus();trials.push({distance,height,shift,hit:hit?.id,top:hit?.height});
  if(hit&&Math.abs(hit.height-39.8)<.01)return{point,heading,height,hit,trials};
 }
 return{trials};
});samples.push({case:'actual helicopter chase focus',focus});assert(focus.hit,'Real hovering helicopter chase ray should target dome');
await driver.waitForFunction(()=>focusPointerState().details&&focusPointerState().progress===1,null,{timeout:7000});
const dwell=await driver.evaluate(()=>({pointer:focusPointerState(),flight:flightState(),text:document.querySelector('#flight-focus .focus-info').textContent,hit:pickDistrictFocus()}));
assert.equal(dwell.flight.paused,false);assert.equal(dwell.flight.phase,'flying');assert(Math.abs(dwell.hit.height-39.8)<.01);assert(dwell.text.includes('40 m model height'));samples.push({case:'actual two-second dwell',dwell});
await driver.screenshot({path:'qc/frontage-runtime-focus-dwell.png'});mark('Real helicopter hover fills dwell circle and shows measured dome height through unchanged focus UI');
"""+s[end:]
Path('qc/frontage-runtime-browser.cjs').write_text(s)
