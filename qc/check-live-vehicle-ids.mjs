import fs from 'node:fs';
import {createRequire} from 'node:module';
const {WebSocket}=createRequire(new URL('../multiplayer-server/server.mjs',import.meta.url))('ws');
const config=JSON.parse(fs.readFileSync('multiplayer-config.json','utf8'));
const endpoint=config.url||config.endpoint||config.serverUrl;
if(!endpoint||!endpoint.startsWith('wss://'))throw Error('Missing configured secure room endpoint');
const socket=new WebSocket(endpoint,{origin:'https://www.opencity.world',handshakeTimeout:10000}),messages=[];
socket.on('message',bytes=>messages.push(JSON.parse(bytes)));
const wait=async predicate=>{const deadline=Date.now()+10000;while(Date.now()<deadline){const error=messages.find(m=>m.type==='error');if(error)throw Error(error.code);const i=messages.findIndex(predicate);if(i>=0)return messages.splice(i,1)[0];await new Promise(r=>setTimeout(r,50));}throw Error('Room test timed out');};
try{
 await new Promise((resolve,reject)=>{socket.once('open',resolve);socket.once('error',reject)});
 socket.send(JSON.stringify({type:'create',name:'Vehicle release QA',protocol:1,world:'cbd-1'}));const welcome=await wait(m=>m.type==='welcome');
 for(const vehicle of ['cybertruck','cybercab','yulu','delivery']){
  socket.send(JSON.stringify({type:'pose',pose:{vehicle,lng:77.594,lat:12.975,altitude:0,heading:0,pitch:0,roll:0,speed:0}}));
  await wait(m=>m.type==='snapshot'&&m.players.some(p=>p.id===welcome.id&&p.pose.vehicle===vehicle));console.log(vehicle+': accepted by live room server');
 }
}finally{socket.close();}
