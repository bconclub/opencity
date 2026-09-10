// Optional personal analytics. Durable locally; cloud writes require verified Auth.
const PREFIX='opencity-ride-v1:',VEHICLES=new Set(['auto','helicopter','cycle','drone','supercar','cab','yulu','bike','delivery']);
export function installPlayerStats(config={}) {
 if(window.playerStats)return window.playerStats;
 const url=config.url?new URL(config.url):null;
 if(url&&(url.protocol!=='https:'||url.username||url.password))throw Error('Supabase requires an HTTPS project URL.');
 const key=String(config.anonKey||config.publishableKey||'');
 if(key.startsWith('sb_secret_'))throw Error('Only a public Supabase key belongs in the browser.');
 if(key.split('.').length===3){try{const claims=JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));if(claims.role==='service_role')throw Error('Service role key is forbidden in browser configuration.');}catch(error){if(error.message.includes('Service role'))throw error;}}
 let current=null,last=performance.now(),saved=0,accessToken=null,userId=null,flushing=false,stopped=false,lastError='',storageAvailable=true,authGeneration=0,authClient=null,authSubscription=null;
 function report(message){lastError=message;window.dispatchEvent(new CustomEvent('player-stats-status',{detail:{configured:!!(url&&key),signedIn:!!userId,storageAvailable,error:message}}));}
 function records(){try{return Object.keys(localStorage).filter(k=>k.startsWith(PREFIX)).map(k=>{try{return JSON.parse(localStorage.getItem(k));}catch{return null;}}).filter(r=>r?.id&&VEHICLES.has(r.vehicle)&&Number.isFinite(r.active_seconds));}catch{storageAvailable=false;return [];}}
 function persist(record){try{localStorage.setItem(PREFIX+record.id,JSON.stringify(record));storageAvailable=true;return true;}catch{storageAvailable=false;report('Ride history could not be saved on this device.');return false;}}
 function round(n){return Math.round(n*1000)/1000;}
 function checkpoint(){if(!current)return;current.revision++;current.synced=false;persist(current);saved=performance.now();}
 function end(){if(!current)return;current.ended_at=new Date().toISOString();checkpoint();current=null;void flush();}
 function vehicleState(){
  const auto=window.autoState?.(),flight=window.flightState?.();
  if(auto?.active)return{vehicle:auto.vehicleType||'auto',paused:auto.paused,speed:auto.speed||0,flying:false};
  if(flight?.active)return{vehicle:'helicopter',paused:flight.paused,speed:flight.velocity?Math.hypot(flight.velocity.x,flight.velocity.y):Math.abs(flight.speed||0),flying:['takeoff','flying','landing'].includes(flight.phase)};
  return null;
 }
 function sample(){
  const now=performance.now(),elapsed=Math.max(0,(now-last)/1000);last=now;const state=vehicleState();
  if(current&&(state?.vehicle!==current.vehicle||current.player_id!==userId))end();
  if(state&&!current&&!document.hidden){
   if(records().length>=1000){report('Local ride history is full. Export or clear saved history before recording more rides.');return;}
   current={id:crypto.randomUUID(),player_id:userId,vehicle:state.vehicle,started_at:new Date().toISOString(),ended_at:null,active_seconds:0,flight_seconds:0,distance_m:0,revision:0,synced:false};checkpoint();
   return;
  }
  // A throttled/hidden tab must never accrue minutes of phantom play time.
  if(current&&state&&!state.paused&&!document.hidden&&elapsed<=1.5){
   current.active_seconds=round(Math.min(86400,current.active_seconds+elapsed));
   if(state.flying)current.flight_seconds=round(Math.min(current.active_seconds,current.flight_seconds+elapsed));
   current.distance_m=round(Math.min(20000000,current.distance_m+Math.min(100,Math.abs(state.speed))*elapsed));
  }
  if(current&&now-saved>=10000)checkpoint();
 }
 async function request(path,options={}){
  if(!url||!key||!accessToken)throw Error('Supabase is not configured and authenticated.');
  const response=await fetch(new URL(path,url.origin),{...options,headers:{apikey:key,Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json',...options.headers},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error(`Player data request failed (${response.status}).`);
  return response.status===204?null:response.text().then(text=>text?JSON.parse(text):null);
 }
 async function flush(){
  if(flushing||!userId||!accessToken||!url||!key||!navigator.onLine)return;
  flushing=true;const owner=userId;
  try{
   for(const row of records().filter(r=>!r.synced&&r.player_id===owner)){
    if(owner!==userId)break;
    const {id,player_id,vehicle,started_at,ended_at,active_seconds,flight_seconds,distance_m}=row;
    await request('/rest/v1/ride_sessions?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({id,player_id,vehicle,started_at,ended_at,active_seconds,flight_seconds,distance_m})});
    // Do not mark a newer checkpoint as sent when a network response is late.
    const latest=records().find(r=>r.id===id);if(latest?.revision===row.revision){latest.synced=true;persist(latest);if(current?.id===id&&current.revision===row.revision)current.synced=true;}
   }
   report('');
  }catch(error){report(error.message);}finally{flushing=false;}
 }
 async function setSession(token){
  const generation=++authGeneration;
  if(!token){if(current){sample();end();}accessToken=null;userId=null;report('');return null;}
  if(!url||!key)throw Error('Configure Supabase before signing in to player data.');
  try{
   const response=await fetch(new URL('/auth/v1/user',url.origin),{headers:{apikey:key,Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(15000)});
   if(!response.ok)throw Error(`Player authentication failed (${response.status}).`);
   const user=await response.json();if(!user?.id)throw Error('Supabase Auth did not return a user.');
   if(generation!==authGeneration)return null;
   // Token refresh should not split a continuing ride or inflate ride counts.
   if(user.id!==userId&&current){sample();end();}
   accessToken=token;userId=user.id;report('');void flush();return userId;
  }catch(error){if(generation===authGeneration){if(current){sample();end();}accessToken=null;userId=null;report(error.message);}throw error;}
 }
 // Called only by a visible user action. Does not create a Supabase project.
 async function connectCloud(displayName,{create=true}={}){
  if(!url||!key)throw Error('Supabase project configuration is missing.');
  try{
   if(!authClient){
    const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.57.4');
    authClient=createClient(url.origin,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:'opencity-supabase-auth'}});
    authSubscription=authClient.auth.onAuthStateChange((_event,session)=>{queueMicrotask(()=>{if(!stopped)void setSession(session?.access_token||null).catch(()=>{});});}).data.subscription;
   }
   let {data,error}=await authClient.auth.getSession();if(error)throw error;
   if(!data.session&&!create)return false;
   if(!data.session){const result=await authClient.auth.signInAnonymously();if(result.error)throw result.error;data=result.data;}
   if(!data.session?.access_token)throw Error('Cloud authentication did not return a session.');
   await setSession(data.session.access_token);
   if(displayName)await saveProfile({displayName});
   await flush();return stats();
  }catch(error){report(error.message||'Cloud connection unavailable.');throw error;}
 }
 async function saveProfile({displayName,favoriteVehicle}){
  const display_name=String(displayName||'').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,24);
  if(!display_name||favoriteVehicle!==undefined&&favoriteVehicle!==null&&!VEHICLES.has(favoriteVehicle))throw Error('Enter a name and supported favorite vehicle.');
  if(!userId)throw Error('Sign in before saving a cloud profile.');
  return request('/rest/v1/profiles?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({id:userId,display_name,...(favoriteVehicle===undefined?{}:{favorite_vehicle:favoriteVehicle})})});
 }
 async function listMeetups(){
  if(!url||!key)throw Error('Supabase project configuration is missing.');
  const endpoint=new URL('/rest/v1/meetups',url.origin);endpoint.searchParams.set('published','eq.true');endpoint.searchParams.set('ends_at','gte.'+new Date().toISOString());endpoint.searchParams.set('order','starts_at.asc');endpoint.searchParams.set('limit','50');
  const response=await fetch(endpoint,{headers:{apikey:key,...(accessToken?{Authorization:`Bearer ${accessToken}`}:{})},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error(`Meetups are unavailable (${response.status}).`);
  const rows=await response.json();return rows.map(row=>({id:row.id,topic:row.title,host:row.host_name,scheduledAt:row.starts_at,expectedAttendance:row.expected_attendance}));
 }
 async function createMeetup(data){
  if(!userId)throw Error('Connect your cloud profile before publishing a meetup.');
  const start=new Date(data.scheduledAt),topic=String(data.topic||'').trim().slice(0,120),host=String(data.host||'').trim().slice(0,24),expected=Number(data.expectedAttendance);
  if(!topic||!host||!Number.isFinite(start.getTime())||start.getTime()<Date.now()||!Number.isInteger(expected)||expected<1||expected>8)throw Error('Enter a topic, host name, future time and 1–8 attendees.');
  const result=await request('/rest/v1/meetups',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({host_id:userId,host_name:host,title:topic,starts_at:start.toISOString(),ends_at:new Date(start.getTime()+3600000).toISOString(),expected_attendance:expected,published:true})});
  return{id:result[0].id,topic,host,scheduledAt:start.toISOString(),expectedAttendance:expected};
 }
 function stats(){
  const rows=records().filter(r=>r.player_id===userId);if(current){const i=rows.findIndex(r=>r.id===current.id);if(i>=0)rows[i]=current;else rows.push(current);}
  const vehicles={};for(const r of rows){const v=vehicles[r.vehicle]||={rides:0,activeSeconds:0,flightSeconds:0,distanceM:0};v.rides++;v.activeSeconds+=r.active_seconds;v.flightSeconds+=r.flight_seconds;v.distanceM+=r.distance_m;}
  return{scope:'this-browser',configured:!!(url&&key),signedIn:!!userId,storageAvailable,error:lastError,pending:rows.filter(r=>!r.synced).length,vehicles,favoriteVehicle:Object.keys(vehicles).sort((a,b)=>vehicles[b].activeSeconds-vehicles[a].activeSeconds||a.localeCompare(b))[0]||null};
 }
 const timer=setInterval(sample,500),syncTimer=setInterval(()=>void flush(),30000);
 const hidden=()=>{sample();checkpoint();},leave=()=>{sample();end();},online=()=>void flush();
 document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',leave);window.addEventListener('online',online);
 const api={setSession,connectCloud,restoreCloud:()=>connectCloud(undefined,{create:false}),listMeetups,createMeetup,saveProfile,flush,stats,exportHistory:()=>JSON.stringify(records(),null,2),
  clearSyncedHistory(){for(const r of records())if(r.synced&&r.ended_at&&r.player_id===userId)localStorage.removeItem(PREFIX+r.id);},
  destroy(){if(stopped)return;stopped=true;authSubscription?.unsubscribe();authClient?.auth.stopAutoRefresh();sample();end();clearInterval(timer);clearInterval(syncTimer);document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',leave);window.removeEventListener('online',online);delete window.playerStats;}
 };
 window.playerStats=api;return api;
}




