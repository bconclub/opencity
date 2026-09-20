const $=id=>document.getElementById(id);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const places=[
 ['CBD · Central Bengaluru',77.595,12.975,16],['Vidhana Soudha',77.5908,12.9796,17.3],['UB City',77.5955,12.9719,17.5],['Cubbon Park',77.592,12.9745,16],['High Court',77.5927,12.9779,17.3],['Chinnaswamy Stadium',77.5996,12.9788,16.8],['Museum & Kasturba Road',77.5964,12.974,17.2]
];
places.forEach((p,i)=>$('place').add(new Option(p[0],i)));
if(innerWidth<761){document.body.classList.add('compact');$('collapse').setAttribute('aria-expanded','false');$('collapse').textContent='+';}
$('collapse').onclick=()=>{const closed=document.body.classList.toggle('compact');$('collapse').setAttribute('aria-expanded',String(!closed));$('collapse').textContent=closed?'+':'−';};
let map,ready=false,orbit=false,frame,lastTime=0,statusTimer,loadTimer;
function status(message){$('status').textContent=message;}
function fail(message){clearTimeout(loadTimer);$('failure').hidden=false;$('failure-text').textContent=message;status('Map unavailable');}
function stopOrbit(){orbit=false;cancelAnimationFrame(frame);$('orbit').textContent='Start orbit';$('orbit').setAttribute('aria-pressed','false');lastTime=0;}
function move(camera){stopOrbit();map.flyTo({...camera,duration:reduced?0:1800});}
function sync(){const c=map.getCenter();$('coordinates').textContent=`${c.lat.toFixed(4)}° N · ${c.lng.toFixed(4)}° E`;$('zoom').textContent=map.getZoom()<13?'City scale':map.getZoom()<15?'Neighbourhood scale':'Building scale';$('pitch').value=Math.round(map.getPitch());$('pitch-value').textContent=`${Math.round(map.getPitch())}°`;const flat=map.getPitch()<5;$('flat').setAttribute('aria-pressed',String(flat));$('three').setAttribute('aria-pressed',String(!flat));}
boot();
