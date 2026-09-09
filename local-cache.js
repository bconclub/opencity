// A fresh release.json chooses the worker version. Never cache that manifest.
if('serviceWorker' in navigator&&window.isSecureContext){
 window.addEventListener('load',async()=>{try{const response=await fetch('./release.json',{cache:'no-store'});if(!response.ok)return;const release=await response.json();await navigator.serviceWorker.register('./sw.js?v='+encodeURIComponent(release.version),{updateViaCache:'none'});}catch(error){console.warn('Local asset cache unavailable:',error.message);}});
}
