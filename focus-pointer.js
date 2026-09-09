(() => {
 const root=document.createElement('div');root.id='flight-focus';root.hidden=true;
 root.innerHTML='<div class="focus-cross"><svg viewBox="0 0 60 60" aria-hidden="true"><path d="M30 4v8M30 48v8M4 30h8M48 30h8"/><circle class="focus-track" cx="30" cy="30" r="20"/><circle class="focus-progress" cx="30" cy="30" r="20" pathLength="100"/><circle cx="30" cy="30" r="2" class="focus-dot"/></svg></div><div class="focus-info" hidden><strong></strong><span></span><small></small></div>';
 document.body.append(root);const ring=root.querySelector('.focus-progress'),info=root.querySelector('.focus-info');
 let target=null,since=0,last=0,progress=0;
 function reset(){target=null;since=0;progress=0;info.hidden=true;ring.style.strokeDashoffset='100';root.classList.remove('has-target');}
 function tick(now){requestAnimationFrame(tick);if(now-last<100)return;last=now;
  const state=window.flightState?.(),active=state?.active&&!state.paused&&state.phase==='flying'&&state.cameraMode==='chase';root.hidden=!active;
  if(!active){reset();return;}
  const hit=window.pickDistrictFocus?.();if(!hit){reset();return;}
  if(hit.id!==target?.id){reset();target=hit;since=now;}
  root.classList.add('has-target');progress=Math.min(1,(now-since)/2000);ring.style.strokeDashoffset=String(100-progress*100);
  if(progress===1){info.hidden=false;info.querySelector('strong').textContent=hit.name;info.querySelector('span').textContent=`${Math.round(hit.height)} m model height · ${hit.source}`;info.querySelector('small').textContent=hit.note;}
 }
 window.focusPointerState=()=>({target:target?.id||null,progress,visible:!root.hidden,details:!info.hidden});requestAnimationFrame(tick);
})();
