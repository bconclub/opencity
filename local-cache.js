// Version discovery stays outside the asset cache so old clients can update.
if('serviceWorker' in navigator&&window.isSecureContext){
 let waiting=null,reloadPending=false,reloading=false;
 const riding=()=>window.autoState?.().active||window.flightState?.().active;
 function updateWhenIdle(){if(riding())return;if(reloadPending&&!reloading){reloading=true;location.reload();return;}waiting?.postMessage({type:'ACTIVATE_RELEASE'});}
 navigator.serviceWorker.addEventListener('controllerchange',()=>{reloadPending=true;updateWhenIdle();});
 async function check(){try{const response=await fetch('./release.json',{cache:'no-store'});if(!response.ok)return;const release=await response.json();const reg=await navigator.serviceWorker.register('./sw.js?v='+encodeURIComponent(release.version),{updateViaCache:'none'});const ready=()=>{if(reg.waiting){waiting=reg.waiting;updateWhenIdle();}};ready();reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed')ready();});});}catch(error){console.warn('Local asset cache unavailable:',error.message);}}
 window.addEventListener('load',check);window.addEventListener('focus',check);setInterval(updateWhenIdle,1000);
}
