const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'),fs=require('node:fs');
const known=['cycle','helicopter','auto','cybertruck','cybercab','kitt'];
const requested=process.argv.slice(2);
if(requested.some(id=>!known.includes(id)))throw Error('Unknown vehicle preview ID');
const vehicles=requested.length?requested:known;
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4173/qc/render-vehicle-previews.html');await page.waitForFunction(()=>!!window.renderVehiclePreview);
 fs.mkdirSync('assets/vehicles/previews',{recursive:true});
 for(const id of vehicles){const data=await page.evaluate(id=>renderVehiclePreview(id),id);const file='assets/vehicles/previews/'+id+'.webp';fs.writeFileSync(file,Buffer.from(data.split(',')[1],'base64'));console.log(id,fs.statSync(file).size);}
 if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
