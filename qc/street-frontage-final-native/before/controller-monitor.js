// Always visible, independent of the vehicle simulation and its settings panel.
const panel=document.createElement('details');
panel.id='controller-monitor';
panel.innerHTML='<summary><span class="pad-led"></span><span id="controller-label">Controller: checking…</span></summary><div class="pad-details"><p id="controller-help"></p><output id="controller-inputs"></output><button type="button">Check controller</button></div>';
document.body.append(panel);
const label=panel.querySelector('#controller-label'),help=panel.querySelector('#controller-help'),inputs=panel.querySelector('output');
let lastSignal=0;
function update(){
 let pads=[];
 try{pads=Array.from(navigator.getGamepads?.()||[]).filter(p=>p?.connected);}catch(e){panel.dataset.state='blocked';label.textContent='Controller: access blocked';help.textContent=e.message;inputs.textContent='';return;}
 const pad=pads.find(p=>p.mapping==='standard')||pads[0];
 if(!pad){panel.dataset.state='missing';label.textContent='Controller: no browser signal';help.textContent='Connect USB controller, click game, then press A or move a stick. If unchanged, open this game in Chrome or Edge.';inputs.textContent=navigator.getGamepads?'Waiting for controller input…':'Gamepad API unavailable in this browser.';lastSignal=0;return;}
 const axes=Array.from(pad.axes),pressed=Array.from(pad.buttons).map((b,i)=>({i,value:b.value,pressed:b.pressed})).filter(b=>b.pressed||b.value>.08);
 const active=axes.some(a=>Math.abs(a)>.16)||pressed.length>0;
 if(active)lastSignal=performance.now();
 const supported=pad.mapping==='standard';
 panel.dataset.state=supported?(active?'active':'connected'):'unsupported';
 label.textContent=pad.id;
 const mode=window.autoState?.().active?window.autoState():window.flightState?.().active?window.flightState():null;
 help.textContent=!supported?'Detected, but standard mapping unavailable.':document.hidden?'Game paused while tab hidden.':mode?.gamepad?.armed?'Ready · controller controls vehicle':mode&&!mode.gamepad?.armed?'Release sticks and buttons to activate.':'Connected · choose a vehicle';
 inputs.textContent='Axes: '+axes.map(a=>a.toFixed(2)).join(' / ')+'\nButtons: '+(pressed.map(b=>b.i+' ('+b.value.toFixed(2)+')').join(', ')||'none')+'\n'+(active?'Receiving input':lastSignal?'Last input '+Math.floor((performance.now()-lastSignal)/1000)+'s ago':'Waiting for first input');
}
panel.querySelector('button').onclick=()=>{window.focus();update();};
window.addEventListener('gamepadconnected',update);window.addEventListener('gamepaddisconnected',update);
setInterval(update,100);update();
