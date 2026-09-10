(() => {
 function prepare(hud){
  if(!hud)return;
  let options=hud.querySelector(':scope > .controller-options');
  if(!options){options=document.createElement('details');options.className='controller-options';const summary=document.createElement('summary');summary.textContent='Controls';const body=document.createElement('div');body.className='controller-options-body';options.append(summary,body);hud.append(options);hud.dataset.dashboard='true';}
  const body=options.querySelector('.controller-options-body');
  // Vehicle controls arrive after asynchronous imports. Reconcile only direct children,
  // so existing controls retain their listeners and are never moved repeatedly.
  for(const el of [...hud.children]){
   if(el.matches('.gamepad-status')){const next=el.nextElementSibling;body.append(el);if(next?.tagName==='BUTTON')body.append(next);}
   else if(el.matches('.tilt-controls,#auto-message,#flight-message,#pad-distance,.flight-note,span.sub'))body.append(el);
  }
 }
 setInterval(()=>{for(const id of ['auto','flight']){const hud=document.getElementById(id+'-hud');prepare(hud);if(!hud||hud.hidden)continue;const speed=Number(document.getElementById(id+'-speed')?.textContent)||0;hud.style.setProperty('--speed-arc',Math.min(270,speed/(id==='auto'?70:180)*270)+'deg');}},100);
})();
