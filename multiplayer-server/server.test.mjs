import test from 'node:test';
import assert from 'node:assert/strict';
import {WebSocket} from 'ws';
import {createRoomServer} from './server.mjs';
const origin='http://localhost:4173';
const pose={vehicle:'auto',lng:77.594,lat:12.975,altitude:0,heading:90,pitch:0,roll:0,speed:12};
async function connect(url){
  const ws=new WebSocket(url,{origin});const messages=[];ws.on('message',data=>messages.push(JSON.parse(data)));
  await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject);});
  return {ws,messages,send:message=>ws.send(JSON.stringify(message)),async wait(predicate){
    const deadline=Date.now()+2500;while(Date.now()<deadline){const i=messages.findIndex(predicate);if(i>=0)return messages.splice(i,1)[0];await new Promise(r=>setTimeout(r,10));}throw new Error('Message timeout');
  }};
}
test('real websocket peers: room isolation, validation, reconnect, limits and expiry',async()=>{
 const app=createRoomServer({allowedOrigins:origin,idleMs:100,heartbeatMs:50,maxPerAddress:40});
 await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${app.server.address().port}`;const url=base.replace('http:','ws:')+'/ws';
 try {
  assert.equal((await (await fetch(base+'/health')).json()).ok,true);
  const a=await connect(url),b=await connect(url),c=await connect(url);
  a.send({type:'create',name:'A',protocol:1,world:'cbd-1'});const aw=await a.wait(m=>m.type==='welcome');assert.match(aw.room,/^[a-f0-9]{32}$/);
  b.send({type:'join',room:aw.room,name:'B',protocol:1,world:'cbd-1'});const bw=await b.wait(m=>m.type==='welcome');assert.equal(bw.players.length,2);assert.notEqual(aw.id,bw.id);
  c.send({type:'create',name:'C',protocol:1,world:'cbd-1'});const cw=await c.wait(m=>m.type==='welcome');assert.notEqual(cw.room,aw.room);
  a.send({type:'pose',pose});const movement=await b.wait(m=>m.type==='snapshot'&&m.players.some(p=>p.id===aw.id&&p.pose.speed===12));assert.deepEqual(movement.players.find(p=>p.id===aw.id).pose,pose);
  const isolated=await c.wait(m=>m.type==='snapshot');assert.equal(isolated.players.length,1);assert.equal(isolated.players[0].id,cw.id);
  a.send({type:'pose',pose:{...pose,lng:0}});assert.equal((await a.wait(m=>m.type==='error')).code,'invalid_pose');
  a.send({type:'pose',pose:{...pose,speed:'12'}});assert.equal((await a.wait(m=>m.type==='error')).code,'invalid_pose');
  b.ws.close();await new Promise(r=>b.ws.once('close',r));await a.wait(m=>m.type==='snapshot'&&m.players.length===1);
  const re=await connect(url);re.send({type:'join',room:aw.room,name:'B',protocol:1,world:'cbd-1'});const rw=await re.wait(m=>m.type==='welcome');assert.notEqual(rw.id,bw.id);
  const extra=[];for(let i=0;i<6;i++){const peer=await connect(url);extra.push(peer);peer.send({type:'join',room:aw.room,name:'guest'+i,protocol:1,world:'cbd-1'});await peer.wait(m=>m.type==='welcome');}
  const ninth=await connect(url);ninth.send({type:'join',room:aw.room,name:'Ninth',protocol:1,world:'cbd-1'});assert.equal((await ninth.wait(m=>m.type==='error')).code,'room_full');
  const wrong=await connect(url);wrong.send({type:'join',room:aw.room,name:'Wrong',protocol:2,world:'cbd-1'});assert.equal((await wrong.wait(m=>m.type==='error')).code,'version_mismatch');
  const flood=await connect(url);const closed=new Promise(r=>flood.ws.once('close',code=>r(code)));for(let i=0;i<65;i++)flood.send({type:'join',room:'0'.repeat(32),name:'Flood',protocol:1,world:'cbd-1'});assert.equal(await closed,1008);
  const large=await connect(url);const tooLarge=new Promise(r=>large.ws.once('close',code=>r(code)));large.ws.send('x'.repeat(3000));assert.equal(await tooLarge,1009);
  await assert.rejects(new Promise((resolve,reject)=>{const denied=new WebSocket(url,{origin:'https://evil.example'});denied.once('open',()=>{denied.close();resolve();});denied.once('error',reject);}),/403/);
  c.ws.close();await new Promise(r=>c.ws.once('close',r));await new Promise(r=>setTimeout(r,220));assert.equal(app.rooms.has(cw.room),false);
 } finally {await app.close();}
});

test('open matchmaking never discovers private rooms and overflows full public rooms',async()=>{
 const app=createRoomServer({allowedOrigins:origin});
 await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const url=`ws://127.0.0.1:${app.server.address().port}/ws`;
 try {
  const privatePeer=await connect(url);privatePeer.send({type:'create',name:'Private',protocol:1,world:'cbd-1'});
  const privateWelcome=await privatePeer.wait(m=>m.type==='welcome');assert.equal(privateWelcome.public,false);
  let first;
  for(let i=0;i<8;i++) {
   const peer=await connect(url);peer.send({type:'open',name:'Public'+i,protocol:1,world:'cbd-1'});
   const welcome=await peer.wait(m=>m.type==='welcome');assert.equal(welcome.public,true);assert.notEqual(welcome.room,privateWelcome.room);
   if(!first)first=welcome;
   assert.equal(welcome.room,first.room);assert.equal(welcome.players.length,i+1);
  }
  const overflow=await connect(url);overflow.send({type:'open',name:'Overflow',protocol:1,world:'cbd-1'});
  const newRoom=await overflow.wait(m=>m.type==='welcome');assert.equal(newRoom.public,true);assert.notEqual(newRoom.room,first.room);assert.notEqual(newRoom.room,privateWelcome.room);assert.equal(newRoom.players.length,1);
  const snapshot=await privatePeer.wait(m=>m.type==='snapshot');assert.equal(snapshot.players.length,1);assert.equal(snapshot.players[0].id,privateWelcome.id);
  const invite=await connect(url);invite.send({type:'join',room:newRoom.room,name:'Invite',protocol:1,world:'cbd-1'});assert.equal((await invite.wait(m=>m.type==='welcome')).public,true);
 }finally {await app.close();}
});
