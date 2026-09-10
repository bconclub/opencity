const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');const assert=require('assert/strict');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1440,height:850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto((process.env.QC_ORIGIN||'http://127.0.0.1:4173')+'/vehicle-review.html');
 await page.waitForFunction(()=>document.querySelectorAll('.viewer canvas').length===3&&[...document.querySelectorAll('.status')].every(e=>e.textContent.startsWith('Drag')),{timeout:60000});
 await page.screenshot({path:'qc/cybercab-three-way.png'});const viewer=await page.locator('.viewer').first().boundingBox();await page.mouse.move(viewer.x+100,viewer.y+100);await page.mouse.down();await page.mouse.move(viewer.x+200,viewer.y+140,{steps:10});await page.mouse.up();await page.locator('#reset').click();
 assert.deepEqual(errors,[]);console.log('PASS three loaded model variants, drag, reset, no browser errors');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
