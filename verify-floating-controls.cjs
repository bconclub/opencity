const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const p=await browser.newPage({viewport:{width:500,height:900},isMobile:true,hasTouch:true,serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('**/multiplayer-client.js',r=>r.fulfill({contentType:'application/javascript',body:''}));await p.goto('http://127.0.0.1:4173/?floatingqc=1');await p.waitForFunction(()=>window.domeState?.().loaded,null,{timeout:120000});await p.locator('#mobile-menu-toggle').click();await p.locator('[data-tool=rides]').click();await p.locator('[data-ride=auto]').click();await p.locator('.departure-options button').first().click();await p.waitForFunction(()=>window.autoState?.().active);await p.waitForTimeout(250);await p.locator('#mobile-drive-demo button').click();
 const cdp=await p.context().newCDPSession(p);const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([id,x,y])=>({id,x,y,radiusX:1,radiusY:1,force:1}))});
 await touch('touchStart',[[1,100,550],[2,380,550]]);await touch('touchMove',[[1,100,500],[2,425,550]]);await p.waitForTimeout(500);const active=await p.evaluate(()=>({touch:mobileDriveState(),auto:autoState()}));assert.equal(active.touch.pointers.length,2);assert(active.touch.keys.includes('ArrowUp'));assert.equal(active.auto.cameraOrbit.yaw,0);await p.screenshot({path:'D:/CodexTools/Blender/floating-dual-auto.png'});
 await touch('touchCancel',[]);await p.waitForTimeout(50);assert.equal((await p.evaluate(()=>mobileDriveState())).keys.length,0);
 await touch('touchStart',[[3,100,550]]);await touch('touchMove',[[3,100,500]]);await p.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal((await p.evaluate(()=>mobileDriveState())).pointers.length,0);await touch('touchEnd',[]);
 await p.evaluate(()=>document.getElementById('exit-auto').click());await p.locator('#mobile-menu-toggle').click();await p.locator('[data-tool=rides]').click();await p.locator('[data-ride=helicopter]').click();await p.locator('.departure-options button').first().click();await p.waitForFunction(()=>window.flightState?.().active);await p.waitForTimeout(250);
 await touch('touchStart',[[4,380,550]]);await touch('touchMove',[[4,425,550]]);await p.waitForTimeout(300);assert.equal((await p.evaluate(()=>flightState())).cameraOrbitYaw,0);await touch('touchEnd',[]);
 await Promise.all([touch('touchStart',[[5,150,450]]),touch('touchEnd',[]),touch('touchStart',[[5,150,450]]),touch('touchEnd',[])]);assert((await p.evaluate(()=>mobileDriveState())).keys.includes('Space'));await p.waitForTimeout(1000);assert(!(await p.evaluate(()=>mobileDriveState())).keys.includes('Space'));
 assert.equal(errors.length,0,errors.join('\n'));console.log(JSON.stringify({passed:true,twoTouches:active.touch,cameraYaw:active.auto.cameraOrbit.yaw,releaseCancelBlur:true,automaticChaseView:true,doubleTapHover:true,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});




