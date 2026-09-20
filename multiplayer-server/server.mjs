import http from 'node:http';
import { randomBytes, randomUUID, createHmac } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';

export const PROTOCOL = 1;
export const WORLD = 'cbd-1';
export const MAX_PLAYERS = 8;
const DEFAULT_ORIGINS = 'https://opencity-two.vercel.app,http://127.0.0.1:4173,http://localhost:4173';
const DEFAULT_POSE = Object.freeze({vehicle:'spectator',lng:77.5945,lat:12.9755,altitude:0,heading:0,pitch:0,roll:0,speed:0});
const ranges = {lng:[77.57,77.62],lat:[12.95,13],altitude:[0,1000],heading:[-360,360],pitch:[-180,180],roll:[-180,180],speed:[-150,150]};
const signJWT=(claims,secret)=>{const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');const unsigned=encode({alg:'HS256',typ:'JWT'})+'.'+encode(claims);return unsigned+'.'+createHmac('sha256',secret).update(unsigned).digest('base64url');};
export function validPose(pose) {
  if (!pose || !['cybertruck','cybercab','kitt','auto','helicopter','supercar','yulu','bike','delivery','cycle','spectator'].includes(pose.vehicle)) return false;
  if(pose.color!==undefined && !['green','yellow','red','blue','white','black'].includes(pose.color))return false;
  return Object.entries(ranges).every(([key,[min,max]]) => typeof pose[key] === 'number' && Number.isFinite(pose[key]) && pose[key] >= min && pose[key] <= max);
}
function cleanName(value) {
  if (typeof value !== 'string') return null;
  const name = value.normalize('NFKC').replace(/[\p{C}<>]/gu,'').trim().slice(0,24);
  return name || null;
}

export function createRoomServer(options = {}) {
  const origins = new Set((options.allowedOrigins ?? process.env.ALLOWED_ORIGINS ?? DEFAULT_ORIGINS).split(',').map(s=>s.trim()).filter(Boolean));
  const rooms = new Map();
  const connections = new Set();
  const idleMs = options.idleMs ?? 10 * 60_000;
  const maxRooms = options.maxRooms ?? 500;
  const maxConnections = options.maxConnections ?? 1000;
  const voice = options.livekit ?? {url:process.env.LIVEKIT_URL,key:process.env.LIVEKIT_API_KEY,secret:process.env.LIVEKIT_API_SECRET};
  const voiceReady = (()=>{try{return !!voice.key && !!voice.secret && new URL(voice.url).protocol==='wss:';}catch{return false;}})();
  const voiceRoom=room=>'opencity-'+room,voiceCleanup=new Set();
  function removeVoice(client){
    if(!client.lastVoiceToken || !voiceReady)return;
    const now=Math.floor(Date.now()/1000),room=voiceRoom(client.room);
    const token=signJWT({iss:voice.key,iat:now,nbf:now-5,exp:now+60,video:{room,roomAdmin:true}},voice.secret);
    const endpoint=new URL('/twirp/livekit.RoomService/RemoveParticipant',voice.url.replace(/^wss:/,'https:'));
    const pending=Promise.resolve().then(()=>(options.livekitFetch??fetch)(endpoint,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({room,identity:client.id}),signal:AbortSignal.timeout(3000)})).catch(()=>{}).finally(()=>voiceCleanup.delete(pending));
    voiceCleanup.add(pending);
  }
  const server = http.createServer((request,response) => {
    response.setHeader('Cache-Control','no-store');
    response.setHeader('X-Content-Type-Options','nosniff');
    if(request.url==='/rooms') {
      response.setHeader('Vary','Origin');
      const origin=request.headers.origin;
      if(!origin || !origins.has(origin)){response.writeHead(403);response.end('Forbidden');return;}
      response.setHeader('Access-Control-Allow-Origin',origin);
      if(request.method==='OPTIONS'){
        response.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
        response.writeHead(204);response.end();return;
      }
      if(request.method!=='GET'){response.setHeader('Allow','GET, OPTIONS');response.writeHead(405);response.end('Method not allowed');return;}
      const directory=[...rooms].filter(([,room])=>room.public===true && room.players.size>0)
        .sort(([aid,a],[bid,b])=>b.players.size-a.players.size || aid.localeCompare(bid)).slice(0,50)
        .map(([id,room])=>({room:id,playerCount:room.players.size,capacity:MAX_PLAYERS,label:'Public room '+id.slice(0,6)}));
      response.writeHead(200,{'Content-Type':'application/json'});response.end(JSON.stringify({rooms:directory}));return;
    }
    if (request.method === 'GET' && request.url === '/health') {
      response.writeHead(200,{'Content-Type':'application/json'});
      response.end(JSON.stringify({ok:true,protocol:PROTOCOL,world:WORLD,rooms:rooms.size,players:[...rooms.values()].reduce((sum,r)=>sum+r.players.size,0)}));
    } else { response.writeHead(404); response.end('Not found'); }
  });
  const wss = new WebSocketServer({noServer:true,maxPayload:2048,perMessageDeflate:false});
  server.on('upgrade',(request,socket,head) => {
    if (request.url !== '/ws' || !origins.has(request.headers.origin) || connections.size >= maxConnections) {
      socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); return;
    }
    const address = socket.remoteAddress;
    // Do not trust X-Forwarded-For from arbitrary clients. Proxy must also limit upgrades.
    if ([...connections].filter(c=>c.address===address).length >= (options.maxPerAddress ?? 32)) {
      socket.end('HTTP/1.1 429 Too Many Requests\r\nConnection: close\r\n\r\n'); return;
    }
    wss.handleUpgrade(request,socket,head,ws=>wss.emit('connection',ws,request));
  });
  const send = (ws,message) => {
    if (ws.readyState !== WebSocket.OPEN) return;
    if (ws.bufferedAmount > 64*1024) { ws.close(1013,'Slow connection'); return; }
    ws.send(JSON.stringify(message));
  };
  const players = room => [...room.players.values()].map(c=>({id:c.id,name:c.name,pose:c.pose}));
  const error = (client,code) => send(client.ws,{type:'error',code});
  wss.on('connection',(ws,request) => {
    const client = {ws,address:request.socket.remoteAddress,id:null,room:null,name:null,pose:{...DEFAULT_POSE},alive:true,tokens:60,lastToken:Date.now(),joinedAt:Date.now(),invalid:0};
    connections.add(client);
    ws.on('error',()=>{});
    ws.on('pong',()=>{client.alive=true;});
    ws.on('close',()=>{
      connections.delete(client);
      removeVoice(client);
      const room = rooms.get(client.room);
      if (room) { room.players.delete(client.id); if (!room.players.size) room.emptySince=Date.now(); }
    });
    ws.on('message',(raw,isBinary)=>{
      const now=Date.now();
      client.tokens=Math.min(60,client.tokens+(now-client.lastToken)*0.03); client.lastToken=now;
      if (client.tokens<1) {ws.close(1008,'Rate limit');return;} client.tokens--;
      const bad = code => {error(client,code);if(++client.invalid>=5)ws.close(1008,'Invalid messages');};
      let message;
      try {if(isBinary)throw new Error();message=JSON.parse(raw.toString());}catch{return bad('invalid_message');}
      if (!message || typeof message !== 'object' || Array.isArray(message))return bad('invalid_message');
      if(message.type==='voice-token') {
        const requestId=typeof message.requestId==='string'?message.requestId.slice(0,64):'';
        const voiceError=(code,message)=>send(ws,{type:'voice-error',requestId,code,message});
        if(!requestId || message.requestId.length>64)return voiceError('invalid_request','Voice request ID required.');
        // Identity and room come exclusively from this socket's current membership.
        if(!client.id || !rooms.get(client.room)?.players.has(client.id))return voiceError('not_joined','Join a room before enabling voice.');
        if(!voiceReady)return voiceError('voice_unavailable','Voice is not configured on this server yet.');
        if(client.lastVoiceToken && now-client.lastVoiceToken<10000)return voiceError('voice_rate_limited','Wait a moment before reconnecting voice.');
        client.lastVoiceToken=now;
        const issued=Math.floor(now/1000),expiresAt=issued+300;
        const claims={iss:voice.key,sub:client.id,iat:issued,nbf:issued-5,exp:expiresAt,jti:randomUUID(),video:{room:voiceRoom(client.room),roomJoin:true,canPublish:true,canPublishSources:['microphone'],canSubscribe:true,canPublishData:false,canUpdateOwnMetadata:false}};
        const token=signJWT(claims,voice.secret);
        send(ws,{type:'voice-token',requestId,url:voice.url,token,expiresAt});return;
      }
      if (message.type==='create' || message.type==='join' || message.type==='open') {
        if(client.id)return bad('already_joined');
        if(message.protocol!==PROTOCOL || message.world!==WORLD)return bad('version_mismatch');
        const name=cleanName(message.name);if(!name)return bad('invalid_name');
        let roomId=message.room,room;
        if(message.type==='create' || message.type==='open') {
          if(message.type==='open') {
            const available=[...rooms].find(([,candidate])=>candidate.public===true && candidate.players.size<MAX_PLAYERS && (!candidate.emptySince || now-candidate.emptySince<=idleMs));
            if(available)[roomId,room]=available;
          }
          if(!room) {
            if(rooms.size>=maxRooms)return error(client,'server_full');
            roomId=randomBytes(16).toString('hex');room={players:new Map(),emptySince:null,public:message.type==='open'};rooms.set(roomId,room);
          }
        } else {
          if(typeof roomId!=='string' || !/^[a-f0-9]{32}$/.test(roomId))return bad('room_not_found');
          room=rooms.get(roomId);if(!room)return error(client,'room_not_found');
        }
        if(room.players.size>=MAX_PLAYERS)return error(client,'room_full');
        client.id=randomUUID();client.name=name;client.room=roomId;
        room.emptySince=null;room.players.set(client.id,client);
        send(ws,{type:'welcome',room:roomId,id:client.id,protocol:PROTOCOL,world:WORLD,public:room.public===true,players:players(room)});
      } else if(message.type==='emote') {
        if(!client.id)return bad('not_joined');
        if(!['hi','wave'].includes(message.emote))return bad('invalid_emote');
        if(client.lastEmote && now-client.lastEmote<2000)return error(client,'emote_rate_limited');
        client.lastEmote=now;
        for(const peer of rooms.get(client.room).players.values())send(peer.ws,{type:'emote',id:client.id,emote:message.emote});
      } else if(message.type==='pose') {
        if(!client.id)return bad('not_joined');
        if(!validPose(message.pose))return bad('invalid_pose');
        // Server validates shape/bounds, not driving physics. Shared vehicles are social ghosts.
        client.pose=Object.fromEntries(['vehicle',...Object.keys(ranges),...(message.pose.color===undefined?[]:['color'])].map(key=>[key,message.pose[key]]));
      } else return bad('unknown_message');
    });
  });
  const snapshotTimer=setInterval(()=>{
    for(const room of rooms.values())if(room.players.size) {
      const message={type:'snapshot',players:players(room)};
      for(const client of room.players.values())send(client.ws,message);
    }
  },100);
  const heartbeatTimer=setInterval(()=>{
    for(const client of connections) {
      if(!client.alive || (!client.id && Date.now()-client.joinedAt>15000)){client.ws.terminate();continue;}
      client.alive=false;client.ws.ping();
    }
    for(const [id,room] of rooms)if(room.emptySince && Date.now()-room.emptySince>idleMs)rooms.delete(id);
  },options.heartbeatMs ?? 15000);
  return {server,wss,rooms,async close(){clearInterval(snapshotTimer);clearInterval(heartbeatTimer);for(const c of connections)c.ws.terminate();await new Promise(resolve=>wss.close(resolve));await Promise.allSettled([...voiceCleanup]);await new Promise(resolve=>server.close(resolve));}};
}
if(process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const app=createRoomServer();const port=Number(process.env.PORT || 8787);
  app.server.listen(port,'0.0.0.0',()=>console.log(`OpenCity rooms listening on ${port}`));
  const stop=()=>app.close().then(()=>process.exit(0));process.on('SIGTERM',stop);process.on('SIGINT',stop);
}

