const fs=require('node:fs');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const {createRoomServer}=await import('../multiplayer-server/server.mjs');
 const http=require('node:http'),fixture=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html'});res.end('<!doctype html><title>Local transport diagnostic</title>');});
 await new Promise(r=>fixture.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+fixture.address().port;
 const rooms=createRoomServer({allowedOrigins:origin}),events=[];let browser;
 rooms.server.on('upgrade',req=>events.push({event:'upgrade',url:req.url,origin:req.headers.origin}));
 await new Promise(r=>rooms.server.listen(0,'127.0.0.1',r));
 const endpoint='ws://127.0.0.1:'+rooms.server.address().port+'/ws';
 try{
  browser=await chromium.launch({channel:'msedge',headless:true,args:['--disable-gpu']});
  const page=await browser.newPage();
  page.on('console',m=>events.push({event:'console',type:m.type(),text:m.text()}));
  page.on('websocket',ws=>{events.push({event:'websocket',url:ws.url()});ws.on('socketerror',error=>events.push({event:'socketerror',error}));ws.on('framereceived',f=>events.push({event:'received',payload:String(f.payload)}));});
  await page.goto(origin);
  const result=await page.evaluate(endpoint=>new Promise(resolve=>{const ws=new WebSocket(endpoint),timer=setTimeout(()=>{ws.close();resolve({timeout:true});},10000);ws.onopen=()=>ws.send(JSON.stringify({type:'join',name:'Transport Probe',action:'create'}));ws.onmessage=e=>{clearTimeout(timer);resolve({message:e.data});ws.close();};ws.onerror=()=>{clearTimeout(timer);resolve({error:true});};ws.onclose=e=>{clearTimeout(timer);resolve({code:e.code,reason:e.reason});};}),endpoint);
  const output={endpoint,result,events};fs.writeFileSync('qc/vidhana-passage-transport-results.json',JSON.stringify(output,null,2));console.log(JSON.stringify(output));
 }finally{await browser?.close();await rooms.close();await new Promise(r=>fixture.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
