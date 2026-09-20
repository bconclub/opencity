const held=new Set(),touches=new Map();let boostTimer=0,lastSwipe=null,hoverTimer=0,lastTap=null;
const driveInput={throttle:0,reverse:0,steer:0};
const analog=value=>Math.sign(value)*Math.min(1,Math.max(0,(Math.min(1,Math.abs(value))-.18)/.82));
function clearAnalog(){driveInput.throttle=driveInput.reverse=driveInput.steer=0;}
window.mobileDriveInput=()=>({...driveInput});
const ride=()=>window.autoState?.().active?'auto':window.flightState?.().active?'flight':'';
const ridePaused=()=>{const auto=window.autoState?.();return auto?.active?auto.paused:!!window.flightState?.()?.paused;};
function key(code,on){if(on===held.has(code))return;on?held.add(code):held.delete(code);document.querySelector('#map canvas')?.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,key:code,bubbles:true}));}
// One floating movement pad, anchored to the first map touch anywhere on screen.
const stick=document.createElement('div');stick.className='floating-ride-stick';stick.dataset.side='movement';stick.hidden=true;stick.innerHTML='<span></span>';stick.setAttribute('aria-hidden','true');document.body.append(stick);
if(matchMedia('(any-pointer:coarse)').matches)document.body.classList.add('touch-ride-input');
function clearDrive(){clearAnalog();for(const code of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'])key(code,false);}
function release(){clearAnalog();const old=[...touches.values()];touches.clear();for(const t of old)try{t.target.releasePointerCapture(t.id);}catch{};stick.hidden=true;for(const code of [...held])key(code,false);clearTimeout(hoverTimer);clearTimeout(boostTimer);lastSwipe=null;lastTap=null;}
function hover(){if(!ride()||ridePaused())return;key('Space',true);clearTimeout(hoverTimer);hoverTimer=setTimeout(()=>key('Space',false),900);}
const mapTouch=e=>e.pointerType==='touch'&&!!ride()&&e.target.matches?.('#map canvas');
function consume(e){e.preventDefault();e.stopImmediatePropagation();}
function down(e){
 if(!mapTouch(e))return;consume(e);document.body.classList.add('touch-ride-input');
 if(ridePaused()||document.body.classList.contains('mobile-tools-open'))return;
 // Sync immediately: the ride-change timer must not cancel the first drag.
 if(lastRide!==ride()){release();lastRide=ride();}
 if(touches.size){for(const t of touches.values())t.multi=true;return;}
 const t={id:e.pointerId,side:'movement',target:e.target,cx:e.clientX,cy:e.clientY,x:0,y:0,time:e.timeStamp,moved:0,multi:false};
 touches.set(t.id,t);try{t.target.setPointerCapture(t.id);}catch{}
 stick.style.left=t.cx+'px';stick.style.top=t.cy+'px';stick.firstChild.style.transform='translate(0,0)';stick.hidden=false;
 demo.hidden=true;clearTimeout(demoTimer);
}
function move(e){
 const t=touches.get(e.pointerId);if(!t){if(mapTouch(e))consume(e);return;}consume(e);
 if(ridePaused()||document.body.classList.contains('mobile-tools-open')){release();return;}
 const dx=e.clientX-t.cx,dy=e.clientY-t.cy;t.moved=Math.max(t.moved,Math.hypot(dx,dy));
 const length=Math.max(42,Math.hypot(dx,dy));t.x=dx/length;t.y=dy/length;
 stick.firstChild.style.transform=`translate(${t.x*27}px,${t.y*27}px)`;
 const forward=analog(-t.y);driveInput.throttle=Math.max(0,forward);driveInput.reverse=Math.max(0,-forward);driveInput.steer=analog(t.x);
 if(ride()==='flight'&&forward>.15&&window.flightState?.().phase==='parked')document.getElementById('takeoff')?.click();
}
function up(e){
 const t=touches.get(e.pointerId);if(!t){if(mapTouch(e))consume(e);return;}consume(e);touches.delete(t.id);stick.hidden=true;clearDrive();
 try{t.target.releasePointerCapture(t.id);}catch{}
 const now=e.timeStamp;
 if(e.type==='pointerup'&&!t.multi&&t.y<-.65&&t.moved>45&&now-t.time<450){if(lastSwipe&&now-lastSwipe<650){key('ShiftLeft',true);clearTimeout(boostTimer);boostTimer=setTimeout(()=>key('ShiftLeft',false),2000);lastSwipe=null;}else lastSwipe=now;}else if(e.type!=='pointerup')lastSwipe=null;
 if(e.type==='pointerup'&&!t.multi&&t.moved<14&&now-t.time<300){if(lastTap&&now-lastTap.time<450&&Math.hypot(t.cx-lastTap.x,t.cy-lastTap.y)<36){hover();lastTap=null;}else lastTap={time:now,x:t.cx,y:t.cy};}else lastTap=null;
}
window.addEventListener('resize',release);
new MutationObserver(()=>{if(document.body.classList.contains('mobile-tools-open'))release();}).observe(document.body,{attributes:true,attributeFilter:['class']});
document.addEventListener('pointerdown',down,{capture:true,passive:false});document.addEventListener('pointermove',move,{capture:true,passive:false});for(const type of ['pointerup','pointercancel','lostpointercapture'])document.addEventListener(type,up,{capture:true,passive:false});window.addEventListener('opencity:release-input',release);window.addEventListener('blur',release);document.addEventListener('visibilitychange',()=>{if(document.hidden)release();});
const demo=document.createElement('aside');demo.id='mobile-drive-demo';demo.hidden=true;demo.innerHTML='<strong>Touch anywhere on the map</strong><p>A pad appears under your thumb. Drag to move and steer.<br>Double-tap to stop / hover.<br>Swipe up twice quickly for a 2-second boost.</p><button type="button">Got it</button>';document.body.append(demo);let demoTimer;demo.querySelector('button').onclick=()=>{demo.hidden=true;clearTimeout(demoTimer);try{localStorage.setItem('opencity-touch-demo-4','seen');}catch{}};
let demoShown=false;
function showDemo(){if(demoShown||!matchMedia('(pointer:coarse)').matches)return;demoShown=true;try{if(localStorage.getItem('opencity-touch-demo-4'))return;}catch{}demo.hidden=false;demoTimer=setTimeout(()=>demo.querySelector('button').click(),8000);}
window.mobileDriveState=()=>({pointers:[...touches.values()].map(t=>({id:t.id,side:t.side,x:t.x,y:t.y})),keys:[...held],analog:{...driveInput},lastTap});
let lastRide='';setInterval(()=>{const ride=window.autoState?.().active?'auto':window.flightState?.().active?'flight':'';if((ridePaused()||document.body.classList.contains('mobile-tools-open'))&&(touches.size||held.size))release();if(lastRide!==ride){release();lastRide=ride;if(ride)showDemo();else demo.hidden=true;}const holder=ride&&document.querySelector('#'+ride+'-hud .controller-options-body');if(holder&&!holder.querySelector('.mobile-vehicle-actions')){const group=document.createElement('div');group.className='mobile-vehicle-actions';for(const id of (ride==='auto'?['pause-auto','auto-camera','exit-auto']:['takeoff','pause-flight','camera-flight','exit-flight'])){const b=document.createElement('button');b.type='button';b.dataset.control=id;b.onclick=()=>{if(id==='takeoff')window.startFlightTakeoff?.();else document.getElementById(id)?.click();document.getElementById('mobile-menu-close')?.click();};group.append(b);}holder.prepend(group);}document.querySelectorAll('.mobile-vehicle-actions button').forEach(b=>b.textContent=document.getElementById(b.dataset.control)?.textContent||'');},150);
