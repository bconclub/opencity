import {WebSocket} from '../multiplayer-server/node_modules/ws/wrapper.mjs';
const url=process.argv[2]||'wss://opencity-rooms.bconclub.com/ws';
for(const vehicle of ['auto','cybercab','kitt','cybertruck']){
 await new Promise((resolve,reject)=>{
  const ws=new WebSocket(url,{origin:'https://www.opencity.world'});let id;
  const timer=setTimeout(()=>{ws.terminate();reject(Error('Timeout: '+vehicle));},8000);
  ws.on('error',reject);ws.on('open',()=>ws.send(JSON.stringify({type:'create',name:'Vehicle QC',protocol:1,world:'cbd-1'})));
  ws.on('message',raw=>{const m=JSON.parse(raw);if(m.type==='welcome'){id=m.id;ws.send(JSON.stringify({type:'pose',pose:{vehicle,lng:77.5945,lat:12.9755,altitude:0,heading:0,pitch:0,roll:0,speed:0,color:'yellow'}}));}
   if(m.type==='error'||m.type==='snapshot'&&m.players.some(p=>p.id===id&&p.pose.vehicle===vehicle)){console.log(vehicle,m.type==='error'?m.code:'accepted');clearTimeout(timer);ws.close();if(m.type==='error')reject(Error(vehicle+': '+m.code));else resolve();}
  });
 });
}
