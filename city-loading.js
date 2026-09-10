// Gate onboarding on actual scene/asset readiness, not a decorative timer.
const overlay=document.getElementById('city-loading'),status=overlay.querySelector('[role=status]'),progress=overlay.querySelector('progress'),retry=overlay.querySelector('button');
retry.onclick=()=>location.reload();
let preparing=false,assetsReady=false,failed=false;
window.cityBootReady=false;
const deadline=setTimeout(()=>{if(!window.cityBootReady){status.textContent='Loading is taking longer than expected. You can wait or retry.';retry.hidden=false;}},90000);
function failure(error){failed=true;clearTimeout(deadline);status.textContent='The city could not finish loading. Check your connection and retry.';retry.hidden=false;console.warn('City preparation failed:',error);}
const timer=setInterval(async()=>{
 if(failed){clearInterval(timer);return;}
 const district=window.districtState?.().loaded,streets=window.vidhanaStreetState?.().loaded,world=window.streetFurnitureState?.().loaded&&!!window.npcTrafficState;
 const count=Number(!!district)+Number(!!streets)+Number(!!world)+Number(assetsReady);progress.value=count;
 if(retry.hidden)status.textContent=!district?'Building Bengaluru…':!streets?'Laying out streets and landmarks…':!world?'Preparing traffic and streetlights…':'Getting your rides ready…';
 if(district&&!preparing){preparing=true;try{
  const {loadVehicleAsset}=await import('./blender-vehicle.js');
  await Promise.all(['cybertruck','cybercab','kitt'].map(id=>loadVehicleAsset(id)));
  await Promise.all([window.prepareHelicopter?.(),import('./auto-mode.js').then(m=>m.prepareAuto(map))]);
  assetsReady=true;
 }catch(error){failure(error);}}
 finishIfReady();
 function finishIfReady(){if(!world||!assetsReady||window.cityBootReady)return;clearInterval(timer);clearTimeout(deadline);progress.value=4;status.textContent='Ready to explore';
  // Let the completed scene paint before removing its cover.
  requestAnimationFrame(()=>requestAnimationFrame(()=>{window.cityBootReady=true;document.body.classList.remove('city-booting');overlay.remove();window.dispatchEvent(new Event('city-ready'));}));
 }
},150);
