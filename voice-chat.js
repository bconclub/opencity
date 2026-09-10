// LiveKit client 2.22.3. Microphone capture is requested only by explicit Join/Unmute.
const SDK_URL='https://cdn.jsdelivr.net/npm/livekit-client@2.22.3/dist/livekit-client.esm.mjs';
const el=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
const shell=el('section');shell.id='voice-chat';shell.setAttribute('aria-label','Room voice');
const join=el('button','Join voice'),mute=el('button','Mute'),leave=el('button','Leave voice'),play=el('button','Enable audio'),note=el('span');note.setAttribute('role','status');note.className='voice-note';
for(const b of [join,mute,leave,play]){b.type='button';shell.append(b);}shell.append(note);document.body.append(shell);
const audioRoot=el('div');audioRoot.hidden=true;document.body.append(audioRoot);
let sdkPromise,room=null,activeId=null,epoch=0,connected=false,muted=true,busy=false,remoteAudioCount=0,playbackBlocked=false;
const tracks=new Map();
function speakers(ids=[]){window.dispatchEvent(new CustomEvent('multiplayer-speaking',{detail:{ids,localMuted:muted}}));}
function ui(text){const joined=window.multiplayerState?.().connected;shell.hidden=!joined&&!room&&!busy;join.hidden=connected;join.disabled=busy;join.textContent=busy?'Connecting voice…':'Join voice';mute.hidden=leave.hidden=!connected;mute.disabled=busy;mute.textContent=muted?'Unmute':'Mute';mute.setAttribute('aria-pressed',String(muted));play.hidden=!playbackBlocked;if(text!==undefined)note.textContent=text;}
function stopTracks(r){for(const pub of r?.localParticipant?.trackPublications?.values?.()||[])pub.track?.stop();}
async function leaveVoice(text='Voice off'){epoch++;busy=false;const old=room;room=null;activeId=null;connected=false;muted=true;playbackBlocked=false;for(const [track,node]of tracks){track.detach?.();node.remove();}tracks.clear();remoteAudioCount=0;audioRoot.replaceChildren();stopTracks(old);try{await old?.disconnect(true);}catch{}speakers();ui(text);}
async function joinVoice(){if(busy||connected)return;const membership=window.multiplayerState?.();if(!membership?.connected){ui('Join a room first.');return;}const tokenEpoch=++epoch;activeId=membership.id;busy=true;ui('');let r;
 try{
  const tokenPromise=window.requestVoiceToken();sdkPromise??=import(SDK_URL);const [sdk,credentials]=await Promise.all([sdkPromise,tokenPromise]);if(tokenEpoch!==epoch)return;
  const url=new URL(credentials.url);if(url.protocol!=='wss:'&&!(location.hostname==='127.0.0.1'&&url.protocol==='ws:'))throw Error('Invalid voice server URL.');
  r=new sdk.Room({adaptiveStream:false,dynacast:false,stopLocalTrackOnUnpublish:true,publishDefaults:{stopMicTrackOnMute:true}});room=r;
  r.on(sdk.RoomEvent.TrackSubscribed,track=>{if(room!==r||track.kind!==sdk.Track.Kind.Audio)return;const node=track.attach();audioRoot.append(node);tracks.set(track,node);remoteAudioCount=tracks.size;node.play().catch(()=>{if(room===r){playbackBlocked=true;ui('Tap Enable audio to hear players.');}});ui();});
  r.on(sdk.RoomEvent.TrackUnsubscribed,track=>{const node=tracks.get(track);track.detach?.();node?.remove();tracks.delete(track);remoteAudioCount=tracks.size;});
  r.on(sdk.RoomEvent.ActiveSpeakersChanged,list=>{if(room===r)speakers(list.map(p=>p.identity));});
  r.on(sdk.RoomEvent.AudioPlaybackStatusChanged,()=>{if(room===r){playbackBlocked=!r.canPlaybackAudio;ui();}});
  r.on(sdk.RoomEvent.Disconnected,()=>{if(room===r)leaveVoice('Voice disconnected. Tap Join voice to reconnect.');});
  r.on(sdk.RoomEvent.Reconnecting,()=>{if(room===r)leaveVoice('Voice connection lost. Tap Join voice to reconnect.');});
  await r.connect(url.href,credentials.token);if(tokenEpoch!==epoch){stopTracks(r);await r.disconnect(true);return;}
  // No camera tracks, screen capture, or background microphone activation.
  await r.localParticipant.setMicrophoneEnabled(true);if(tokenEpoch!==epoch){stopTracks(r);await r.disconnect(true);return;}
  connected=true;muted=false;busy=false;ui('Mic on');
 }catch(error){if(tokenEpoch!==epoch){stopTracks(r);try{await r?.disconnect(true);}catch{}return;}sdkPromise=undefined;const text=error?.name==='NotAllowedError'?'Microphone permission denied. Tap Join voice to retry.':String(error?.message||'Voice unavailable.');await leaveVoice(text);}
}
join.onclick=joinVoice;leave.onclick=()=>leaveVoice();
mute.onclick=async()=>{if(!room||busy)return;const r=room,t=epoch;busy=true;ui();try{await r.localParticipant.setMicrophoneEnabled(muted);if(t!==epoch){stopTracks(r);await r.disconnect(true);return;}muted=!muted;ui(muted?'Mic muted':'Mic on');if(muted)speakers();}catch(e){if(t===epoch)ui(String(e.message||'Microphone unavailable.'));}finally{if(t===epoch){busy=false;ui();}}};
play.onclick=async()=>{try{await room?.startAudio();for(const node of tracks.values())await node.play();playbackBlocked=false;ui('Audio enabled');}catch{ui('Audio blocked. Check browser sound permissions.');}};
window.addEventListener('multiplayer-players',e=>{if(activeId&&e.detail?.id!==activeId)leaveVoice('Room changed. Voice off.');else ui();});
window.addEventListener('pagehide',()=>leaveVoice());

for(const event of ['keydown','keyup','pointerdown','pointerup'])shell.addEventListener(event,e=>e.stopPropagation());
window.voiceState=()=>({connected,muted,connecting:busy,remoteAudioCount,playbackBlocked,playerId:activeId});
ui();
