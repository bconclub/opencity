import {paintHex,selectedVehicleColor} from './vehicle-colors.js';
export function installSocialControls(){
 if(document.getElementById('vehicle-paint-options'))return;
 const picker=document.getElementById('vehicle-picker');if(!picker)return;
 const field=document.createElement('fieldset');field.id='vehicle-paint-options';field.className='vehicle-paint-options';
 const legend=document.createElement('legend');legend.textContent='Vehicle color';field.append(legend);
 const selected=selectedVehicleColor();legend.textContent='Vehicle colour';

 const colorInput=document.createElement('input');colorInput.type='color';colorInput.id='vehicle-spectrum';colorInput.value=paintHex(selected)||'#16845f';colorInput.setAttribute('aria-label','Choose any vehicle color');
 field.append(colorInput);

 const spectrum=document.createElement('canvas');spectrum.width=280;spectrum.height=100;spectrum.className='vehicle-spectrum-canvas';spectrum.setAttribute('aria-label','Vehicle colour spectrum. Tap or drag to choose; use the colour input for keyboard selection.');field.insertBefore(spectrum,colorInput);
 const ctx=spectrum.getContext('2d');const hue=ctx.createLinearGradient(0,0,280,0);for(let i=0;i<=6;i++)hue.addColorStop(i/6,'hsl('+i*60+',100%,50%)');ctx.fillStyle=hue;ctx.fillRect(0,0,280,100);const shade=ctx.createLinearGradient(0,0,0,100);shade.addColorStop(0,'#fff');shade.addColorStop(.5,'#ffffff00');shade.addColorStop(.51,'#00000000');shade.addColorStop(1,'#000');ctx.fillStyle=shade;ctx.fillRect(0,0,280,100);
 let picking=null;function pick(e){const r=spectrum.getBoundingClientRect(),x=Math.max(0,Math.min(279,Math.round((e.clientX-r.left)/r.width*279))),y=Math.max(0,Math.min(99,Math.round((e.clientY-r.top)/r.height*99)));const rgb=ctx.getImageData(x,y,1,1).data;colorInput.value='#'+[...rgb].slice(0,3).map(n=>n.toString(16).padStart(2,'0')).join('');colorInput.dispatchEvent(new Event('input',{bubbles:true}));}
 spectrum.onpointerdown=e=>{e.preventDefault();picking=e.pointerId;spectrum.setPointerCapture(e.pointerId);pick(e);};spectrum.onpointermove=e=>{if(picking===e.pointerId)pick(e);};for(const event of ['pointerup','pointercancel','lostpointercapture'])spectrum.addEventListener(event,()=>{picking=null;});
 colorInput.addEventListener('input',()=>{const color=colorInput.value;try{localStorage.setItem('opencity-vehicle-color',color);}catch{}window.dispatchEvent(new CustomEvent('vehicle-color-change',{detail:{color}}));});
 picker.insertBefore(field,picker.querySelector(':scope > button')); 
 const hi=document.createElement('button');hi.id='quick-hi';hi.type='button';hi.className='quick-hi';hi.textContent='👋 Hi';hi.setAttribute('aria-label','Say hi to everyone in this room');hi.title='Say hi to your room';document.body.append(hi);
 const notice=document.createElement('span');notice.className='quick-hi-notice';notice.setAttribute('role','status');document.body.append(notice);
 let until=0;const update=()=>{const connected=!!window.multiplayerState?.().connected;hi.hidden=!connected;hi.disabled=performance.now()<until;};
 hi.onclick=()=>{if(typeof window.sendQuickEmote!=='function'||!window.sendQuickEmote('hi')){notice.textContent='Join a connected room to say hi.';return;}until=performance.now()+2200;hi.disabled=true;notice.textContent='Hi sent';setTimeout(()=>{notice.textContent='';update();},2300);};
 window.addEventListener('multiplayer-players',update);update();
}
