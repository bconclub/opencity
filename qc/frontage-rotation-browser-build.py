from pathlib import Path
s=Path('qc/frontage-runtime-browser.cjs').read_text()
s=s.replace('frontage-runtime-browser-snapshot','frontage-rotation-browser-snapshot')
s=s.replace('Immutable candidate boots with shared actual architecture and local two-client room','Immutable candidate boots with actual architecture and one local room client')
i=s.index('observer=await page();');j=s.index('await driver.bringToFront();',i);s=s[:i]+s[j:]
i=s.index('const graphCheck=');j=s.index('const coordinates=',i);s=s[:i]+s[j:]
i=s.index('for(const sign of [1,-1])');j=s.index('})().catch',i)
s=s[:i]+"""
const a=coordinates.architecture,s=a.stairPlacement,p=(u,v)=>[(s.centerAlong+u)*s.tangent[0]+v*s.outward[0],(s.centerAlong+u)*s.tangent[1]+v*s.outward[1]],h=Math.atan2(-s.outward[0],-s.outward[1])*180/Math.PI;
for(const direction of ['ArrowRight','ArrowLeft']){
 await driver.evaluate(({point,h})=>__passagePlace(point,h),{point:p(0,s.bottomV+6),h});
 await driver.keyboard.down('ArrowUp');await driver.waitForFunction(()=>autoState().physics.impacts>0);
 await driver.evaluate(()=>{window.__rotationSamples=[];window.__rotationRecording=true;function sample(){if(!window.__rotationRecording)return;window.__rotationSamples.push(autoState());requestAnimationFrame(sample);}sample();});
 await driver.keyboard.down(direction);await driver.waitForTimeout(5000);await driver.keyboard.up(direction);await driver.keyboard.up('ArrowUp');
 const row=await driver.evaluate(()=>{window.__rotationRecording=false;return{states:window.__rotationSamples,footprint:__passageGraphs().footprint};});
 assert(row.states.length>30);assert(row.states.at(-1).physics.impacts>row.states[0].physics.impacts);samples.push({case:'held steering '+direction,...row});
 await driver.screenshot({path:'qc/frontage-rotation-'+direction+'.png'});mark('Held '+direction+' near stair captured with active contact');
}
assert.deepEqual(errors,[]);assert.deepEqual(misses,[]);fs.writeFileSync('qc/frontage-rotation-browser-results.json',JSON.stringify({passed:true,checks,samples,errors,misses,transport,snapshot:manifest,scope:'Bounded held-steering browser evidence. Independent projected-body overlap audit must pass separately. Other previously verified functions unchanged.'},null,2));
"""+s[j:]
s=s.replace('frontage-runtime-browser-failure','frontage-rotation-browser-failure')
Path('qc/frontage-rotation-browser.cjs').write_text(s)
