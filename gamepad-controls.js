const clamp=v=>Math.max(-1,Math.min(1,Number.isFinite(v)?v:0));
export const stick=v=>Math.abs(clamp(v))<.16?0:Math.sign(v)*(Math.abs(clamp(v))-.16)/.84;
export function decodePad(p){
 const b=i=>Math.max(0,Math.min(1,p.buttons[i]?.value||(p.buttons[i]?.pressed?1:0)));
 return{turn:clamp(stick(p.axes[0])+b(15)-b(14)),forward:clamp(-stick(p.axes[1])+b(12)-b(13)),throttle:b(7)<.08?0:b(7),reverse:b(6)<.08?0:b(6),vertical:(b(7)<.08?0:b(7))-(b(6)<.08?0:b(6)),brake:b(0)>.5,camera:b(3)>.5,pause:b(9)>.5,takeoff:b(2)>.5};
}
export function createGamepadControls(parent,mode){
 const status=document.createElement('p');status.className='gamepad-status';status.setAttribute('role','status');status.style.cssText='font-size:11px;line-height:1.4;margin:8px 0;overflow-wrap:anywhere';parent.append(status);
 const zero={turn:0,forward:0,throttle:0,reverse:0,vertical:0,brake:false,camera:false,pause:false,takeoff:false};
 const reconnect=document.createElement('button');reconnect.type='button';reconnect.textContent='Reconnect controller';parent.append(reconnect);
 let error='';let id=null,previous={},armed=false,connected=false;
 function reset(){armed=false;previous={};}
 reconnect.onclick=()=>{reset();poll();};
 function poll(){
  let pads=[];try{pads=Array.from(navigator.getGamepads?.()||[]).filter(p=>p?.connected);}catch(e){error=e.name+': '+e.message;}
  const p=pads.find(p=>p.index===id&&p.mapping==='standard')||pads.find(p=>p.mapping==='standard');
  if(!p){const disconnected=connected;connected=false;id=null;reset();status.textContent=pads.length?'Controller detected. Standard mapping unavailable. Use keyboard or touch.':(error?'Gamepad access blocked: '+error:!navigator.getGamepads?'Gamepad API unavailable. Open this local URL in Chrome or Edge.':'No controller signal. Click game, then press a controller button. Try Chrome or Edge if this stays unchanged.');return{...zero,disconnected};}
  if(id!==p.index){id=p.index;reset();}connected=true;
  const input=decodePad(p);
  if(document.hidden){reset();return{...zero};}
  if(!armed){armed=!Object.values(input).some(Boolean);previous=input;status.textContent=armed?'Gamepad ready: '+p.id:'Gamepad detected. Release sticks and buttons to activate.';return{...zero};}
  const output={...input};for(const key of ['camera','pause','takeoff'])output[key]=input[key]&&!previous[key];previous=input;
  const help=mode==='auto'?'Left stick steer · RT/R2 drive · LT/L2 reverse · A/× brake':'Left stick fly · RT/R2 rise · LT/L2 lower · A/× hover · X/□ takeoff / land';
  const text=p.id+' · '+help+' · Y/△ view · Start/Options pause';if(status.textContent!==text)status.textContent=text;
  return output;
 }
 return{poll,reset,state:()=>({connected,index:id,armed})};
}
