const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1300,height:850},serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://upload.wikimedia.org/**',route=>route.fulfill({contentType:'image/jpeg',body:fs.readFileSync('qc/ambedkar-veedhi-moheen-2019.jpg')}));
 await page.goto('http://127.0.0.1:4173/qc/frontage-fixture-review.html');await page.waitForFunction(()=>window.fixtureReviewReady);await page.waitForTimeout(600);await page.screenshot({path:'qc/frontage-fixture-review.png',fullPage:true});
 await page.locator('#head').click();await page.waitForTimeout(250);await page.screenshot({path:'qc/frontage-fixture-head.png',fullPage:true});
 console.log(JSON.stringify({errors,state:await page.evaluate(()=>window.fixtureReviewState())}));if(errors.length)process.exitCode=1;
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
