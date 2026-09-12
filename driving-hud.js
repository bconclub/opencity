import {loadDrivingData} from './driving-data.js';
import {toLocal} from './auto-roads.js';
import {vehicleProfile} from './vehicle-tuning.js';

const hud=document.createElement('section');hud.id='driving-hud';hud.hidden=true;hud.setAttribute('aria-label','Driving instruments');
hud.innerHTML=`<div class="drive-compass" aria-label="Vehicle heading"><span>NW</span><span>N</span><strong id="drive-heading">000°</strong><span>NE</span><span>E</span></div>
<button class="drive-room" aria-label="Open room controls"><span aria-hidden="true">▥</span><span>Room<small id="drive-online">Offline</small></span></button>
<div class="drive-map"><canvas width="320" height="320" role="img" aria-label="Nearby roads, north up, with your vehicle heading"></canvas><span class="drive-north">N</span><div class="drive-map-caption"><strong>Nearby streets</strong><small id="drive-trip">0.00 km travelled</small></div></div>
<div class="drive-cluster"><div class="drive-altitude-controls"></div><div class="drive-dial"><svg viewBox="0 0 200 200" aria-hidden="true"><path class="dial-track" d="M 36 164 A 90 90 0 1 1 164 164" pathLength="100"/><path class="dial-ticks" d="M 36 164 A 90 90 0 1 1 164 164" pathLength="100"/><path class="dial-speed" d="M 36 164 A 90 90 0 1 1 164 164" pathLength="100"/></svg><div class="drive-speed"><strong id="drive-speed">0</strong><span>km/h</span><b id="drive-gear">N</b></div></div>
<button class="drive-boost" aria-label="Hold to boost"><span aria-hidden="true">ϟ</span><small>BOOST</small><meter min="0" max="100" value="0" aria-label="Boost reserve"></meter></button>
<span id="drive-state"></span><div class="drive-actions"><button data-action="land" aria-label="Take off or land">Land</button><button data-action="pause" aria-label="Pause ride">Ⅱ</button><button data-action="camera" aria-label="Change camera view">View</button><button data-action="exit" aria-label="Exit ride">Exit</button></div></div>`;
document.body.append(hud);
const $=s=>hud.querySelector(s),canvas=$('canvas'),ctx=canvas.getContext('2d');
let mode=null,current=null,roads=[],roadState='loading',loading=false,boostHeld=false;
function text(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value;}
function loadRoads(){if(loading||roadState==='unavailable')return;loading=true;loadDrivingData().then(data=>{roads=data.features.filter(f=>f.properties?._layer==='transportation'&&f.geometry.type==='LineString').map(f=>{const points=f.geometry.coordinates.map(toLocal);return{points,major:['primary','secondary','trunk'].includes(f.properties.class),minX:Math.min(...points.map(p=>p[0])),maxX:Math.max(...points.map(p=>p[0])),minY:Math.min(...points.map(p=>p[1])),maxY:Math.max(...points.map(p=>p[1]))};});roadState='ready';}).catch(()=>{roadState='unavailable';loading=false;});}
function minimap(position,heading){
 if(!ctx||!position)return;const start=performance.now(),p=toLocal(position),range=330,scale=160/range;
 ctx.clearRect(0,0,320,320);ctx.save();ctx.beginPath();ctx.arc(160,160,156,0,Math.PI*2);ctx.clip();ctx.fillStyle='#102421';ctx.fillRect(0,0,320,320);
 ctx.strokeStyle='#244139';ctx.lineWidth=1;for(let i=0;i<=320;i+=40){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,320);ctx.moveTo(0,i);ctx.lineTo(320,i);ctx.stroke();}
 for(const major of [false,true]){ctx.beginPath();ctx.strokeStyle=major?'#6a8479':'#3c584e';ctx.lineWidth=major?5:2.5;for(const r of roads){if(r.major!==major||r.minX>p[0]+range||r.maxX<p[0]-range||r.minY>p[1]+range||r.maxY<p[1]-range)continue;r.points.forEach((v,i)=>ctx[i?'lineTo':'moveTo'](160+(v[0]-p[0])*scale,160-(v[1]-p[1])*scale));}ctx.stroke();}
 ctx.translate(160,160);ctx.rotate(heading*Math.PI/180);ctx.fillStyle='#153d31';ctx.strokeStyle='#54f5b1';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,22,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#f0fff8';ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(10,10);ctx.lineTo(0,5);ctx.lineTo(-10,10);ctx.closePath();ctx.fill();ctx.restore();
 canvas.dataset.drawMs=(performance.now()-start).toFixed(2);
}
function releaseBoost(){if(!boostHeld)return;boostHeld=false;hud.dispatchEvent(new KeyboardEvent('keyup',{code:'ShiftLeft',key:'Shift',bubbles:true}));$('.drive-boost').classList.remove('held');}
$('.drive-boost').addEventListener('pointerdown',e=>{if(!current||current.paused)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);boostHeld=true;e.currentTarget.classList.add('held');hud.dispatchEvent(new KeyboardEvent('keydown',{code:'ShiftLeft',key:'Shift',bubbles:true}));});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('.drive-boost').addEventListener(event,releaseBoost);
for(const event of ['blur','opencity:release-input','resize'])window.addEventListener(event,releaseBoost);
document.addEventListener('keyup',e=>{if(boostHeld&&['Enter','Space'].includes(e.code))releaseBoost();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseBoost();});
$('.drive-boost').addEventListener('keydown',e=>{if(!['Enter','Space'].includes(e.code))return;e.preventDefault();if(!e.repeat&&current&&!current.paused){boostHeld=true;hud.dispatchEvent(new KeyboardEvent('keydown',{code:'ShiftLeft',bubbles:true}));}});
$('.drive-boost').addEventListener('keyup',e=>{if(['Enter','Space'].includes(e.code))releaseBoost();});
$('.drive-room').onclick=()=>document.querySelector('[data-tool="room"]')?.click();
$('.drive-actions').onclick=e=>{const action=e.target.closest('[data-action]')?.dataset.action;if(!action||!mode)return;releaseBoost();const id=action==='camera'?(mode==='auto'?'auto-camera':'camera-flight'):action==='land'?'takeoff':action+'-'+mode;document.getElementById(id)?.click();};
function update(){
 const auto=window.autoState?.(),flight=window.flightState?.();current=auto?.active?auto:flight?.active?flight:null;const next=auto?.active?'auto':flight?.active?'flight':null;
 if(next!==mode){releaseBoost();mode=next;}hud.hidden=!mode;document.body.classList.toggle('driving-hud-active',!!mode);if(!mode||document.hidden)return;
 if(current.paused||document.body.classList.contains('mobile-tools-open'))releaseBoost();loadRoads();
 hud.dataset.mode=mode;const air=mode==='flight',heading=((current.heading%360)+360)%360,speed=air&&current.velocity?Math.hypot(current.velocity.x,current.velocity.y):Math.abs(current.speed),max=air?85:vehicleProfile(current.vehicleType).boostSpeed;
 text('#drive-speed',String(Math.round(speed*3.6)));text('#drive-gear',air?`${Math.round(current.altitude)} m`:speed<.05?'N':current.speed<0?'R':'D');text('#drive-heading',`${String(Math.round(heading)%360).padStart(3,'0')}°`);
 // Neighbouring bearings move with the vehicle; the centre is its real heading.
 const labels=['N','NE','E','SE','S','SW','W','NW'];$('.drive-compass').querySelectorAll('span').forEach((el,i)=>{const offset=[-2,-1,1,2][i];el.textContent=labels[(Math.round(heading/45)+offset+8)%8];});
 $('.dial-speed').style.strokeDasharray=`${Math.min(100,speed/max*100)} 100`;
 const reserve=Math.max(0,Math.min(100,current.boost?.reserve||0));$('.drive-boost meter').value=reserve;$('.drive-boost').disabled=current.paused;$('.drive-boost').setAttribute('aria-label',`Hold to boost, ${Math.round(reserve)} percent available`);
 text('#drive-state',current.paused?'PAUSED':current.roaming?'AUTO-ROAM':air?(current.phase==='parked'?'ON PAD':'FLIGHT'):'');text('#drive-trip',`${((current.distance??current.travel??0)/1000).toFixed(2)} km travelled`);
 const land=$('[data-action="land"]');land.hidden=!air;land.textContent=current.phase==='parked'?'Fly':'Land';land.disabled=air&&(current.paused||['takeoff','landing'].includes(current.phase));const pause=$('[data-action="pause"]');pause.textContent=current.paused?'▶':'Ⅱ';pause.setAttribute('aria-label',current.paused?'Resume ride':'Pause ride');
 const mp=window.multiplayerState?.();text('#drive-online',mp?.connected?`${mp.players.length} online`:'Offline');
 const quick=document.querySelector('.flight-quick-controls');if(quick&&quick.parentElement!==$('.drive-altitude-controls'))$('.drive-altitude-controls').append(quick);
 $('.drive-map-caption strong').textContent=roadState==='ready'?'Nearby streets':roadState==='loading'?'Loading streets':'Map unavailable';minimap(air?[current.lng,current.lat]:current.position,heading);
}
setInterval(update,200);update();
