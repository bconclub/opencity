import {setMapSceneCamera} from './map-scene-camera.js';
import {addVehicleContactShadow,disposeVehicleContactShadow} from './vehicle-contact-shadow.js';
import {installVehicleEnvironment} from './vehicle-environment.js';
import {createBlenderVehicle} from './blender-vehicle.js';
import {createSupercar} from './supercar-model.js';
import {createTwoWheeler} from './vehicle-models.js';
import {createAuto} from './auto-model.js';
import {createHelicopter} from './helicopter.js';

// Geometry uses local metres: X east, Y north, Z up, matching both local rides.
export async function installMultiplayer(map) {
 if(map.__multiplayerRenderer)return map.__multiplayerRenderer;
 if(map.__multiplayerInstallPromise)return map.__multiplayerInstallPromise;
 map.__multiplayerInstallPromise=installRenderer(map);
 try{return await map.__multiplayerInstallPromise;}finally{delete map.__multiplayerInstallPromise;}
}
async function installRenderer(map) {
 if (map.__multiplayerRenderer) return map.__multiplayerRenderer;
 const T=await import('https://unpkg.com/three@0.169.0/build/three.module.js');
 const emotes=new Map();let speaking=new Set();
 const entries=new Map(), scene=new T.Scene(), camera=new T.Camera(),viewProjection=new T.Matrix4();
 const origin=maplibregl.MercatorCoordinate.fromLngLat([77.5945,12.9755],0);
 const scale=origin.meterInMercatorCoordinateUnits();
 const transform=new T.Matrix4().makeTranslation(origin.x,origin.y,origin.z).scale(new T.Vector3(scale,-scale,scale));
 const head=new T.Vector3(),headRotation=new T.Euler(),clip=new T.Vector4(), RAD=Math.PI/180;
 let ownId=null,renderer,disposeEnvironment,last=0,disposed=false;
 scene.add(new T.HemisphereLight(0xffffff,0x688471,2.4));
 const sun=new T.DirectionalLight(0xffefd5,3);sun.position.set(-50,30,100);scene.add(sun);
 const labels=document.createElement('div');labels.className='multiplayer-name-tags';
 Object.assign(labels.style,{position:'absolute',inset:'0',pointerEvents:'none',overflow:'hidden',zIndex:'3'});
 map.getContainer().append(labels);
 function disposeModel(model) {
  if(!model)return;
  disposeVehicleContactShadow(model.group);
  const geometries=new Set(),materials=new Set(),textures=new Set();
  model.group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});
  model.group.removeFromParent();materials.forEach(m=>m.dispose());
  // GLB clones own their materials, but geometry and textures remain cached and
  // shared with other players, the local car and traffic.
  if(!model.group.userData.sharedAssetResources){geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());}
 }
 function remove(id){const e=entries.get(id);if(!e)return;disposeModel(e.model);e.label.remove();entries.delete(id);emotes.delete(id);}
 function valid(p){return p&&['cybertruck','cybercab','kitt','auto','helicopter','supercar','yulu','bike','delivery','cycle'].includes(p.vehicle)&&['lng','lat','altitude','heading','pitch','roll','speed'].every(k=>Number.isFinite(p[k]))&&Math.abs(p.lng)<=180&&Math.abs(p.lat)<85&&p.altitude>=-10&&p.altitude<10000;}
 function position(p){const c=maplibregl.MercatorCoordinate.fromLngLat([p.lng,p.lat],p.vehicle==='helicopter'?p.altitude+2:(p.altitude||0)+.02);return new T.Vector3((c.x-origin.x)/scale,(origin.y-c.y)/scale,c.z/scale);}
 function receive(event){
  const detail=event.detail||{};ownId=detail.id||null;
  const seen=new Set();
  for(const player of (Array.isArray(detail.players)?detail.players:[]).slice(0,32)){
   if(!player?.id||!valid(player.pose)||seen.has(player.id))continue;
   seen.add(player.id);const p=player.pose,own=player.id===ownId;
   let e=entries.get(player.id);
   if(e&&(e.vehicle!==p.vehicle||e.own!==own)){remove(player.id);e=null;}
   if(!e){
    const label=document.createElement('span');label.className='multiplayer-name-tag';label.dataset.playerId=player.id;
    Object.assign(label.style,{position:'absolute',left:'0',top:'0',display:'none',padding:'4px 9px',borderRadius:'12px',background:own?'#123b30ee':'#102c3fee',color:'#fff',font:'600 12px system-ui,sans-serif',whiteSpace:'nowrap',maxWidth:'180px',overflow:'hidden',textOverflow:'ellipsis',border:'1px solid #ffffff55',boxShadow:'0 2px 8px #0005'});
    labels.append(label);
    const model=own?null:(['cybertruck','cybercab','kitt'].includes(p.vehicle)?createBlenderVehicle(T,p.vehicle):p.vehicle==='auto'?createAuto(T,{remote:true}):p.vehicle==='helicopter'?createHelicopter(T,{remote:true}):p.vehicle==='supercar'?createSupercar(T,{remote:true}):createTwoWheeler(T,{variant:p.vehicle,remote:true}));if(model){scene.add(model.group);if(p.vehicle!=="helicopter")Promise.resolve(model.ready).then(()=>{if(model.group.parent)addVehicleContactShadow(T,model.group);}).catch(()=>{});}
    e={vehicle:p.vehicle,own,model,label,current:{...p},target:{...p},point:position(p),angle:0,labelVisible:false};entries.set(player.id,e);
   }
   const labelText=String(player.name||'Explorer').slice(0,24)+(own?' · You':'');
   e.name=labelText;
   if(e.label.textContent!==labelText)e.label.textContent=labelText;
   if(e.model&&p.color)e.model.setPaint?.(p.color);
   // Spawn/reset jumps snap, ordinary packet updates converge without heading wrap spins.
   if(e.point.distanceTo(position(p))>120){e.current={...p};e.point.copy(position(p));}
   e.target={...p};
  }
  for(const id of entries.keys())if(!seen.has(id))remove(id);
  map.triggerRepaint();
 }
 const layer={id:'multiplayer-vehicles',type:'custom',renderingMode:'3d',
  onAdd(m,gl){renderer=new T.WebGLRenderer({canvas:m.getCanvas(),context:gl,antialias:true});renderer.autoClear=false;disposeEnvironment=installVehicleEnvironment(T,renderer,scene);},
  render(gl,args){
   const now=performance.now(),dt=last?Math.min((now-last)/1000,.1):0;last=now;
   viewProjection.fromArray(args.defaultProjectionData.mainMatrix).multiply(transform);setMapSceneCamera(T,camera,viewProjection);
   const factor=1-Math.exp(-dt*14),w=map.getCanvas().clientWidth,h=map.getCanvas().clientHeight;
   for(const [playerId,e] of entries){
    const emote=emotes.get(playerId),greeting=emote&&emote.until>now?(emote.emote==='wave'?' · 👋':' · 👋 Hi!'):'';
    if(emote&&!greeting)emotes.delete(playerId);
    const text=e.name+greeting;if(e.label.textContent!==text)e.label.textContent=text;
    e.label.dataset.emote=String(!!greeting);e.label.dataset.speaking=String(speaking.has(playerId));
    // Own camera advances every frame; a network echo is already out of date.
    // Anchor our tag to the same live pose instead of the 10 Hz server snapshot.
    const live=e.own?window.multiplayerState?.().pose:null;
    const p=e.current,target=valid(live)&&live.vehicle===e.vehicle?live:e.target,f=e.own?1:factor;
    for(const key of ['lng','lat','altitude','pitch','roll','speed'])p[key]+=(target[key]-p[key])*f;
    const headingDelta=(((target.heading-p.heading)%360+540)%360-180)*f;p.heading+=headingDelta;
    e.point.copy(position(p));e.angle+=dt*(e.vehicle!=='helicopter'?p.speed/(e.model?.wheelRadius||.31):21);
    if(e.model){const m=e.model;m.group.position.copy(e.point);m.group.rotation.z=-p.heading*RAD;
     if(e.vehicle!=='helicopter'){m.body.rotation.set(p.pitch,p.roll,0);if(m.updateDrive){const steer=Math.abs(p.speed)>.5&&dt>0?Math.atan(headingDelta*RAD/dt*(e.vehicle==="cybertruck"?3.3:2.5654)/p.speed):0;m.updateDrive(e.angle,steer,now/1000);}else m.wheels.forEach(wheel=>wheel.rotation.x=-e.angle);if(m.pedals)m.pedals.rotation.x=-e.angle*.4;m.updateRider?.(-e.angle*.4);}
     else{m.body.rotation.set(p.pitch,p.roll,0,'YXZ');m.rotor.rotation.z=e.angle;m.tailRotor.rotation.x=-e.angle*3.7;m.rotorDisc.material.opacity=.085;}
    }
    // Project vehicle roof/rotor in 3D. Ground-only markers would drift below aircraft.
    const roof=e.own?window.autoState?.().visualHeight:e.model?.group.userData.visualHeight;
    head.set(0,e.vehicle==='cycle'?.075:0,e.vehicle==='cycle'?1.915:e.vehicle==='helicopter'?6:Number.isFinite(roof)?roof:2.7);
    head.applyEuler(headRotation.set(p.pitch,p.roll,0));
    const hx=head.x,hy=head.y,a=-p.heading*RAD;head.x=hx*Math.cos(a)-hy*Math.sin(a);head.y=hx*Math.sin(a)+hy*Math.cos(a);
    clip.set(e.point.x+head.x,e.point.y+head.y,e.point.z+head.z,1).applyMatrix4(viewProjection);
    const x=clip.x/clip.w,y=clip.y/clip.w,z=clip.z/clip.w;
    e.labelVisible=clip.w>0&&x>=-1&&x<=1&&y>=-1&&y<=1&&z>=-1&&z<=1;
    e.label.style.display=e.labelVisible?'block':'none';
    if(e.labelVisible)e.screenAnchor={x:(x+1)*w/2,y:(1-y)*h/2};
   }
   // Keep labels anchored to their projected vehicle, stacking nearby names above
   // or below that point. Stable player IDs prevent ordering flicker between packets.
   const placed=[],margin=6,gap=4;
   for(const [id,e] of [...entries].sort(([a],[b])=>String(a).localeCompare(String(b)))){
    if(!e.labelVisible)continue;
    const width=e.label.offsetWidth,height=e.label.offsetHeight,anchor=e.screenAnchor;
    const left=Math.max(margin,Math.min(w-width-margin,anchor.x-width/2));
    const base=anchor.y-height-8;
    const overlaps=top=>placed.some(r=>left<r.right+gap&&left+width>r.left-gap&&top<r.bottom+gap&&top+height>r.top-gap);
    const candidates=[base];
    for(let shift=8;shift<=24;shift+=8)candidates.push(base-shift);
    const top=candidates.find(y=>y>=margin&&y+height<=h-margin&&!overlaps(y));
    if(top===undefined){e.label.style.display='none';e.labelVisible=false;continue;}
    e.label.style.transform=`translate3d(${left.toFixed(2)}px,${top.toFixed(2)}px,0)`;
    placed.push({left,right:left+width,top,bottom:top+height});
   }
   if(entries.size){renderer.resetState();const start=performance.now();renderer.render(scene,camera);window.recordCityRender?.('Multiplayer',renderer,performance.now()-start);map.triggerRepaint();}
  },
  onRemove(){disposeEnvironment?.();renderer?.dispose();}
 };
 function destroy(){if(disposed)return;disposed=true;window.removeEventListener('multiplayer-players',receive);window.removeEventListener('multiplayer-emote',showEmote);window.removeEventListener('multiplayer-speaking',showSpeaking);emotes.clear();speaking.clear();map.off('remove',destroy);for(const id of entries.keys())remove(id);labels.remove();if(map.getLayer(layer.id))map.removeLayer(layer.id);delete map.__multiplayerRenderer;}
 function showEmote(event){const {id,emote}=event.detail||{};if(typeof id!=='string'||!['hi','wave'].includes(emote)||!entries.has(id))return;emotes.set(id,{emote,until:performance.now()+3000});map.triggerRepaint();}
 function showSpeaking(event){speaking=new Set(Array.isArray(event.detail?.ids)?event.detail.ids.slice(0,32):[]);map.triggerRepaint();}
 window.addEventListener('multiplayer-emote',showEmote);window.addEventListener('multiplayer-speaking',showSpeaking);
 window.addEventListener('multiplayer-players',receive);map.on('remove',destroy);map.addLayer(layer);
 window.multiplayerRenderState=()=>({ownId,remoteCount:[...entries.values()].filter(e=>!e.own).length,tagCount:entries.size,players:[...entries].map(([id,e])=>({id,own:e.own,vehicle:e.vehicle,...e.current,position:e.point.toArray(),name:e.label.textContent,labelVisible:e.labelVisible,rotorAngle:e.angle,color:e.model?.group.userData.paintColor||e.target.color||null})),disposed});
 const api={destroy};map.__multiplayerRenderer=api;return api;
}





