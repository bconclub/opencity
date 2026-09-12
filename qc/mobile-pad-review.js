const canvas=document.querySelector('canvas'),output=document.getElementById('result');let mode='auto',paused=false;
window.autoState=()=>({active:mode==='auto',paused});window.flightState=()=>({active:mode==='flight',paused,phase:'flying'});
await import('../mobile-drive.js');
const state=()=>window.mobileDriveState(),stick=()=>document.querySelector('.floating-ride-stick'),zeros=()=>Object.values(window.mobileDriveInput()).every(v=>v===0);
function pointer(type,id,x,y){canvas.dispatchEvent(new PointerEvent(type,{pointerId:id,pointerType:'touch',clientX:x,clientY:y,bubbles:true,cancelable:true,button:0,buttons:type==='pointerup'?0:1}));}
const wait=ms=>new Promise(r=>setTimeout(r,ms));let checks=[];
function assert(ok,label){if(!ok)throw Error(label);checks.push(label);output.textContent=checks.join('\n');}
function clear(){window.dispatchEvent(new Event('opencity:release-input'));}
document.getElementById('clear').onclick=clear;
document.getElementById('preview').onclick=()=>{clear();pointer('pointerdown',99,innerWidth*.22,innerHeight*.68);pointer('pointermove',99,innerWidth*.22+20,innerHeight*.68-25);};
document.getElementById('run').onclick=async()=>{
 try{checks=[];clear();mode='auto';paused=false;document.body.classList.remove('mobile-tools-open');
 const x=Math.min(90,innerWidth*.22),y=innerHeight*.64,right=innerWidth*.78;
 assert(document.querySelectorAll('.floating-ride-stick').length===1,'Exactly one joystick');
 pointer('pointerdown',1,x,y);assert(!stick().hidden&&Math.abs(parseFloat(stick().style.left)-x)<.01&&Math.abs(parseFloat(stick().style.top)-y)<.01,'Pad appears at left touch position');
 pointer('pointermove',1,x+20,y-30);assert(state().analog.throttle>0&&state().analog.throttle<1&&state().analog.steer>0,'Diagonal touch gives proportional movement');
 await wait(220);assert(state().pointers.length===1&&state().analog.throttle>0,'First drag survives ride-change timer');
 pointer('pointerdown',2,right,y);pointer('pointermove',2,right-30,y-50);pointer('pointerup',2,right-30,y-50);assert(state().pointers.length===1&&state().pointers[0].id===1,'Second touch cannot steal/release movement');
 pointer('pointermove',1,right,y);assert(state().analog.steer>.9,'Left drag retains ownership across screen midpoint');
 pointer('pointerup',1,right,y);assert(stick().hidden&&zeros(),'Release hides pad and clears movement');
 pointer('pointerdown',3,x+20,y-120);assert(Math.abs(parseFloat(stick().style.top)-(y-120))<.01,'Next touch relocates pad');pointer('pointermove',3,x+20,y-70);assert(state().analog.reverse>0&&state().analog.throttle===0,'Pull down reverses');pointer('pointercancel',3,x+20,y-70);assert(zeros()&&stick().hidden,'Cancelled touch releases input');
 pointer('pointerdown',4,right,y);pointer('pointermove',4,right+20,y-50);pointer('pointerup',4,right+20,y-50);assert(zeros()&&stick().hidden&&state().pointers.length===0,'Right touch creates no pad or input');
 mode='flight';pointer('pointerdown',5,x,y);pointer('pointermove',5,x+20,y-30);assert(state().analog.steer>0&&state().analog.steer<1&&state().keys.length===0,'Helicopter uses analog pad, no full-lock arrow keys');
 paused=true;await wait(220);assert(zeros()&&stick().hidden,'Pause clears held movement');paused=false;
 pointer('pointerdown',6,x,y);pointer('pointermove',6,x+25,y-35);document.body.classList.add('mobile-tools-open');await wait(0);assert(zeros()&&stick().hidden,'Opening menu releases input');document.body.classList.remove('mobile-tools-open');
 pointer('pointerdown',7,x,y);pointer('pointermove',7,x+25,y-35);window.dispatchEvent(new Event('blur'));assert(zeros()&&stick().hidden,'Focus loss releases input');
 pointer('pointerdown',8,x,y);window.dispatchEvent(new Event('resize'));assert(zeros()&&stick().hidden,'Rotation/resize releases input');
 assert(['auto-controls','flight-controls'].every(id=>getComputedStyle(document.getElementById(id)).display==='none'),'Legacy keypads hidden with old CSS loaded last');
 mode='auto';clear();await wait(220);pointer('pointerdown',10,x,y);pointer('pointerup',10,x,y);pointer('pointerdown',11,x,y);pointer('pointerup',11,x,y);assert(state().keys.includes('Space'),'Double tap still brakes/hovers');clear();
 for(const id of [12,13]){pointer('pointerdown',id,x,y);pointer('pointermove',id,x,y-70);pointer('pointerup',id,x,y-70);}
 assert(state().keys.includes('ShiftLeft'),'Two upward swipes still boost');clear();assert(state().keys.length===0,'Release event cancels gesture boost');
 output.textContent='PASS '+checks.length+' checks\nViewport '+innerWidth+' × '+innerHeight+'\n'+checks.join('\n');output.dataset.passed='true';
 }catch(error){output.textContent='FAIL '+error.message;output.dataset.passed='false';throw error;}
};
