const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});page.setDefaultTimeout(45000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/local-cache.js',route=>route.fulfill({contentType:'text/javascript',body:''}));
  await page.route('**/multiplayer-client.js',route=>route.fulfill({contentType:'text/javascript',body:''}));
  await page.goto('http://127.0.0.1:4173/?boostqc=1');
  await page.waitForFunction(()=>window.npcTrafficState&&window.vidhanaStreetState?.().loaded,null,{timeout:90000});
  await page.locator('#mobile-menu-toggle').click();await page.locator('[data-tool=rides]').click();await page.locator('[data-ride=auto]').click();await page.getByRole('button',{name:/Vidhana Soudha area/}).click();await page.waitForFunction(()=>window.autoState?.().active);
  const checks=[];
  async function checkMeter(id){for(const width of [330,390,430]){await page.setViewportSize({width,height:844});const data=await page.locator('#'+id+'-hud .ride-boost-meter').evaluate(el=>{const r=el.getBoundingClientRect(),h=el.closest('section').getBoundingClientRect();return {text:el.textContent,x:r.x,y:r.y,width:r.width,height:r.height,hudRight:h.right,hudBottom:h.bottom,visible:getComputedStyle(el).display!=='none'};});assert(data.visible);assert(data.width>=64);assert(data.x>=0&&data.x+data.width<=width);assert(data.y+data.height<=data.hudBottom+1);checks.push({id,viewportWidth:width,...data});}}
  await checkMeter('auto');assert.equal((await page.evaluate(()=>autoState())).boost.reserve,0);
  await page.evaluate(()=>setAutoRoam(true));await page.waitForTimeout(2500);assert.equal((await page.evaluate(()=>autoState())).boost.reserve,0,'Auto mode preserves manual reserve');assert.match(await page.locator('#auto-hud .ride-boost-meter').innerText(),/AUTO/);
  await page.keyboard.down('ArrowUp');await page.waitForTimeout(300);assert.ok((await page.evaluate(()=>autoState())).boost.reserve>0,'Manual movement earns reserve');await page.keyboard.down('ShiftLeft');await page.waitForTimeout(250);await page.keyboard.up('ShiftLeft');await page.keyboard.up('ArrowUp');assert.equal((await page.evaluate(()=>autoState())).roaming,false);
  await page.screenshot({path:'boost-mobile-qc.png'});
  await page.evaluate(()=>document.getElementById('exit-auto').click());await page.locator('#mobile-menu-toggle').click();await page.locator('[data-tool=rides]').click();await page.locator('[data-ride=helicopter]').click();await page.locator('.departure-options button').first().click();await page.waitForFunction(()=>window.flightState?.().active);await checkMeter('flight');
  assert.equal((await page.evaluate(()=>flightState())).boost.reserve,0);assert.deepEqual(errors,[]);console.log(JSON.stringify({ok:true,checks,errors},null,2));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
