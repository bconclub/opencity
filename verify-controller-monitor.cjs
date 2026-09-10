const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
const p=await b.newPage();await p.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:4173')?r.continue():r.abort());
await p.addInitScript(()=>{window.testPad=null;Object.defineProperty(navigator,'getGamepads',{value:()=>testPad?[testPad]:[]});});
await p.goto('http://127.0.0.1:4173');await p.waitForSelector('#controller-monitor[data-state=missing]');
await p.locator('#controller-monitor summary').click();
await p.evaluate(()=>window.testPad={id:'Test USB controller',connected:true,index:0,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0}))});
await p.waitForSelector('#controller-monitor[data-state=connected]');assert.equal(await p.locator('#controller-label').textContent(),'Test USB controller');
await p.evaluate(()=>{testPad.axes[0]=.7;testPad.buttons[7].value=.8});await p.waitForSelector('#controller-monitor[data-state=active]');assert.match(await p.locator('#controller-inputs').textContent(),/0.70.*\nButtons: 7 \(0.80\)/);
await p.evaluate(()=>testPad.mapping='');await p.waitForSelector('#controller-monitor[data-state=unsupported]');
await p.evaluate(()=>testPad=null);await p.waitForSelector('#controller-monitor[data-state=missing]');
await p.setViewportSize({width:390,height:844});const box=await p.locator('#controller-monitor').boundingBox();assert(box.x>=0&&box.x+box.width<=390);
await p.screenshot({path:'controller-monitor-mobile.png'});
console.log('PASS controller monitor: absent, named device, live axes/buttons, unsupported mapping, disconnect, mobile bounds.');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
