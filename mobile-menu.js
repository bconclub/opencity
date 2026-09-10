const mobile=matchMedia('(max-width:760px), (max-height:550px) and (pointer:coarse)');
const bar=document.createElement('nav');bar.id='mobile-menu';bar.setAttribute('aria-label','Control center');
const icons={rides:'<path d="M4 15V9l3-4h10l3 4v6M4 10h16M7 15v3M17 15v3"/>',room:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3M17 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5"/>',settings:'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>',performance:'<path d="M3 13h4l3-8 4 14 3-6h4"/>'};
const labels={rides:'Rides',room:'Room',settings:'Settings',performance:'Performance'};
for(const key of Object.keys(labels)){const b=document.createElement('button');b.type='button';b.dataset.tool=key;b.setAttribute('aria-label',labels[key]);b.setAttribute('aria-expanded','false');b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">'+icons[key]+'</svg><span>'+labels[key]+'</span>';bar.append(b);}
const close=document.createElement('button');close.id='mobile-menu-close';close.type='button';close.textContent='Close panel ×';close.hidden=true;document.body.append(bar,close);
const menuButton=document.createElement('button');menuButton.id='mobile-menu-toggle';menuButton.type='button';menuButton.setAttribute('aria-label','Open control center');menuButton.setAttribute('aria-expanded','false');menuButton.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';document.body.append(menuButton);
menuButton.onclick=()=>{const expand=!bar.classList.contains('expanded');shut();bar.classList.toggle('expanded',expand);menuButton.setAttribute('aria-expanded',String(expand));};
let active=null,target=null;const oldOpen=new Map();
function shut(){bar.classList.remove('expanded');menuButton.setAttribute('aria-expanded','false');if(target){target.classList.remove('mobile-tool-open');if(target.tagName==='DETAILS')target.open=oldOpen.get(target)||false;}target=null;active=null;document.body.classList.remove('mobile-tools-open');close.hidden=true;for(const b of bar.children)b.setAttribute('aria-expanded','false');}
function show(key){if(active===key){shut();return;}shut();const auto=window.autoState?.(),flight=window.flightState?.();const ride=auto?.active?'auto':flight?.active?'flight':null;
 if(key==='rides'&&ride)document.getElementById('exit-'+ride)?.click();
 target=key==='rides'?document.getElementById('vehicle-picker'):key==='room'?document.getElementById('multiplayer-panel'):key==='performance'?document.getElementById('performance-panel'):ride?document.querySelector('#'+ride+'-hud .controller-options'):document.getElementById('controller-monitor');
 if(!target)return;active=key;document.body.classList.add('mobile-tools-open');target.classList.add('mobile-tool-open');if(target.tagName==='DETAILS'){oldOpen.set(target,target.open);target.open=true;}close.hidden=false;bar.querySelector('[data-tool='+key+']').setAttribute('aria-expanded','true');
 if(ride&&key!=='rides'&&(ride==='auto'?auto:flight)?.paused===false)document.getElementById('pause-'+ride)?.click();
}
bar.addEventListener('click',e=>{const b=e.target.closest('[data-tool]');if(b)show(b.dataset.tool);});close.onclick=shut;
document.addEventListener('keydown',e=>{if((active||bar.classList.contains('expanded'))&&e.key==='Escape'){e.stopImmediatePropagation();shut();}},true);
document.getElementById('vehicle-picker').addEventListener('click',e=>{if(e.target.closest('[data-ride]'))shut();});
mobile.addEventListener('change',shut);
window.addEventListener('multiplayer-ready',()=>{if(mobile.matches)show('rides');});
// Late controller settings are created by the vehicle dashboard, retaining their handlers.
document.addEventListener('click',e=>{if(mobile.matches&&e.target.closest('.controller-options > summary')){e.preventDefault();show('settings');}},true);

// Move existing controls, preserving their live state and click handlers.
const social=document.createElement('div');social.className='control-center-social';bar.append(social);
function gatherControls(){for(const id of ['voice-chat','quick-hi']){const control=document.getElementById(id);if(control&&control.parentElement!==social)social.append(control);}}
gatherControls();new MutationObserver(gatherControls).observe(document.body,{childList:true});

const roam=document.createElement('button');roam.id='auto-roam-toggle';roam.type='button';roam.textContent='Auto-roam';roam.setAttribute('aria-pressed','false');social.prepend(roam);
roam.onclick=()=>{const auto=window.autoState?.(),flight=window.flightState?.(),state=auto?.active?auto:flight?.active?flight:null;if(!state)return;const result=auto?.active?window.setAutoRoam?.(!state.roaming):window.setFlightRoam?.(!state.roaming);if(result)shut();};
setInterval(()=>{const a=window.autoState?.(),f=window.flightState?.(),state=a?.active?a:f?.active?f:null;roam.hidden=!state;roam.textContent=state?.roaming?'Stop auto-roam':'Auto-roam';roam.setAttribute('aria-pressed',String(!!state?.roaming));},250);
