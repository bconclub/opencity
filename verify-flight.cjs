const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',msg=>{if(msg.type()==='error')console.log('BROWSER:',msg.text());});
 await page.goto('http://127.0.0.1:4173');await page.waitForFunction(()=>ready,{timeout:60000});
 await page.locator('#open-hangar').click();await page.locator('#start-flight').click();await page.waitForFunction(()=>window.flightState?.().active,{timeout:60000});
 assert.equal(await page.evaluate(()=>flightState().phase),'parked');await page.waitForFunction(()=>map.areTilesLoaded(),{timeout:60000});
 await page.screenshot({path:'flight-pad.png'});
 await page.locator('#takeoff').click();await page.waitForFunction(()=>flightState().phase==='flying',{timeout:20000});
 const origin=await page.evaluate(()=>flightState());assert(origin.altitude>=89);
 await page.keyboard.down('KeyW');await page.waitForFunction(()=>flightState().travel>25,{timeout:15000});await page.keyboard.up('KeyW');
 await page.keyboard.down('KeyD');await page.waitForFunction(()=>flightState().heading>20);await page.keyboard.up('KeyD');
 await page.keyboard.down('ArrowUp');await page.waitForFunction(()=>flightState().altitude>110);await page.keyboard.up('ArrowUp');
 assert.notEqual((await page.evaluate(()=>flightState())).lat,origin.lat);
 await page.locator('#pause-flight').click();const paused=await page.evaluate(()=>flightState());await page.waitForTimeout(300);assert.deepEqual(await page.evaluate(()=>flightState()),paused);
 await page.screenshot({path:'flight-desktop.png'});
 await page.locator('#camera-flight').click();assert.equal(await page.evaluate(()=>flightState().cameraMode),'overhead');await page.locator('#camera-flight').click();
 await page.locator('#pause-flight').click();await page.locator('#takeoff').click();assert.match(await page.locator('#flight-message').textContent(),/approach a pad/);
 await page.locator('#reset-flight').click();assert.equal(await page.evaluate(()=>flightState().phase),'parked');
 await page.locator('#takeoff').click();await page.waitForFunction(()=>flightState().phase==='flying',{timeout:20000});await page.locator('#takeoff').click();await page.waitForFunction(()=>flightState().phase==='parked',{timeout:20000});assert.equal(await page.evaluate(()=>flightState().altitude),0);
 await page.locator('#exit-flight').click();assert.equal(await page.evaluate(()=>map.dragPan.isEnabled()),true);assert.equal(await page.evaluate(()=>map.getCenterClampedToGround()),true);
 await page.setViewportSize({width:390,height:844});await page.reload();await page.waitForFunction(()=>ready,{timeout:60000});await page.locator('#collapse').click();await page.locator('#open-hangar').click();await page.locator('#start-flight').click();await page.waitForFunction(()=>flightState().active,{timeout:60000});await page.locator('#takeoff').click();await page.waitForFunction(()=>flightState().phase==='flying',{timeout:20000});
 const rect=await page.locator('[data-flight-key="KeyW"]').boundingBox();await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down();await page.waitForFunction(()=>flightState().travel>5);await page.mouse.up();assert.equal(await page.evaluate(()=>flightState().keys.length),0);
 await page.locator('#pause-flight').click();await page.screenshot({path:'flight-mobile.png'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:['3D aircraft layer','takeoff','forward movement','yaw','altitude','pause','camera modes','landing rejection away from pad','reset','successful landing','exit restores map','mobile pointer controls','mobile layout'],errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
