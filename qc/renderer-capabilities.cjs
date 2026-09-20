const fs=require('node:fs');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage();await page.setContent('<canvas id="probe"></canvas>');
 const capabilities=await page.evaluate(()=>{const gl=document.getElementById('probe').getContext('webgl2');if(!gl)return{webgl2:false};const debug=gl.getExtension('WEBGL_debug_renderer_info');return{webgl2:true,vendor:debug?gl.getParameter(debug.UNMASKED_VENDOR_WEBGL):null,renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):null,maxTextureSize:gl.getParameter(gl.MAX_TEXTURE_SIZE),maxSamples:gl.getParameter(gl.MAX_SAMPLES)};});
 const report={date:new Date().toISOString(),browser:browser.version(),launch:'Default headless Edge; no force-software flag',capabilities,scope:'Renderer capability probe only, no game frame-rate or physical-phone measurement.'};fs.writeFileSync('qc/renderer-capabilities.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
