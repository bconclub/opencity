const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});const checks=[];try{
 const p=await b.newPage({viewport:{width:390,height:844}});await p.setContent('<body class="auto-active flight-active"><section id="auto-hud"><div class="instruments"><div>9 km/h</div><div>0 km driven</div><div>D gear</div></div></section><section id="flight-hud" hidden><div class="instruments"><div>0 km/h</div><div>0 m altitude</div></div></section></body>');
 for(const file of ['styles.css','flight.css','auto.css','cockpit.css','mobile-controls.css','vehicle-shell.css','mobile-dashboard.css','mobile-menu.css','mobile-drive.css'])await p.addStyleTag({content:fs.readFileSync(file,'utf8')});
 for(const viewport of [{width:330,height:844},{width:390,height:844},{width:430,height:844},{width:844,height:390}]){await p.setViewportSize(viewport);assert(await p.locator('#auto-hud').isVisible());assert(!await p.locator('#flight-hud').isVisible());checks.push(`hidden flight HUD stays hidden during ground ride ${viewport.width}x${viewport.height}`);}
 await p.evaluate(()=>{document.body.className='flight-active';document.getElementById('auto-hud').hidden=true;document.getElementById('flight-hud').hidden=false;});assert(await p.locator('#flight-hud').isVisible());assert(!await p.locator('#auto-hud').isVisible());checks.push('flight HUD remains available when actually flying');
 fs.writeFileSync('qc/release-fidelity-mobile-hud.json',JSON.stringify({checks},null,2));console.log(JSON.stringify(checks));
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
