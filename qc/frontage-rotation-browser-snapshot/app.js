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
async function boot(){
 try{
  if(!window.maplibregl)throw new Error('Map renderer could not download. Check your connection and reload.');
  loadTimer=setTimeout(()=>fail('Map tiles are taking too long to load. Check connectivity to tiles.openfreemap.org, then reload.'),45000);
  const response=await fetch('https://tiles.openfreemap.org/styles/positron');if(!response.ok)throw new Error('Map style is unavailable. Please reload shortly.');
  const style=await response.json();
  for(const layer of style.layers){
   if(layer.type==='background')layer.paint['background-color']='#dde5dc';
   if(layer.id==='water')layer.paint['fill-color']='#91c4d0';
   if(layer.id==='park')layer.paint['fill-color']='#b0c8a0';
   if(layer.id==='building')layer.layout={...layer.layout,visibility:'none'};
  }
  const labelIndex=style.layers.findIndex(l=>l.type==='symbol');
  style.layers.splice(labelIndex,0,{id:'city-buildings',type:'fill-extrusion',source:'openmaptiles','source-layer':'building',minzoom:13,paint:{'fill-extrusion-color':['interpolate',['linear'],['coalesce',['get','render_height'],8],0,'#d8d8c7',30,'#b6bead',100,'#829b8c'],'fill-extrusion-height':['max',3,['coalesce',['get','render_height'],8]],'fill-extrusion-base':['coalesce',['get','render_min_height'],0],'fill-extrusion-opacity':.96}});
  (await import('./cbd-dome.js')).prepareCBDStyle(style);
  map=new maplibregl.Map({container:'map',style,center:[77.596,12.9716],zoom:16,pitch:60,bearing:-25,maxPitch:85,minZoom:13.7,maxZoom:20,maxBounds:[[77.585,12.966],[77.604,12.985]],hash:true,attributionControl:false});
  map.addControl(new maplibregl.AttributionControl({compact:true}),'bottom-right');
  const attribution=map.getContainer().querySelector('.maplibregl-ctrl-attrib');
  if(attribution){
   const collapse=()=>{attribution.open=false;attribution.classList.remove('maplibregl-compact-show');};
   const initialState=new MutationObserver(()=>{if(attribution.open)collapse();});
   initialState.observe(attribution,{attributes:true,attributeFilter:['open']});
   attribution.querySelector('summary').addEventListener('click',()=>initialState.disconnect(),{once:true});
   map.once('remove',()=>initialState.disconnect());collapse();
  }
  map.addControl(new maplibregl.NavigationControl({visualizePitch:true}),'top-right');map.addControl(new maplibregl.ScaleControl({unit:'metric'}),'bottom-left');
  map.on('load',()=>{ready=true;clearTimeout(loadTimer);$('failure').hidden=true;map.setLight({anchor:'viewport',color:'#fff5df',intensity:.45,position:[1.5,190,45]});sync();status('Explore the city · Building heights are schematic');import('./district.js').then(m=>m.installDistrict(map)).then(()=>import('./cbd-dome.js')).then(m=>m.installDome(map)).then(()=>import('./vidhana-streets.js')).then(m=>m.installVidhanaStreets(map)).then(()=>import('./street-patch.js')).then(m=>m.installStreetPatch(map)).then(patch=>{window.vidhanaStreetPatch=patch;}).then(()=>import('./street-furniture.js')).then(m=>m.installStreetFurniture(map)).then(()=>{if(map.getLayer('vidhana-signals'))map.removeLayer('vidhana-signals');}).then(()=>import('./multiplayer-render.js')).then(m=>m.installMultiplayer(map)).then(()=>import('./npc-traffic.js')).then(m=>m.installTraffic(map)).then(()=>{const state=window.multiplayerState?.();if(state)window.dispatchEvent(new CustomEvent('multiplayer-players',{detail:state}));}).catch(e=>{console.error(e);status('District details could not load. Reload to retry.');});});
  map.on('error',e=>{console.error(e.error);if(!ready)status('Waiting for map data…');else{status('Some map data could not load. Move the view or reload.');clearTimeout(statusTimer);statusTimer=setTimeout(()=>status('Explore the city · Building heights are schematic'),8000);}});
  map.on('move',sync);map.on('dragstart',stopOrbit);map.on('zoomstart',e=>{if(e.originalEvent)stopOrbit();});
  map.on('click','city-buildings',e=>{const f=e.features?.[0];if(!f)return;const p=f.properties||{};$('building-name').textContent=p.name||'Mapped building';const height=Number(p.render_height);$('building-height').textContent=Number.isFinite(height)?`Display height: ${Math.max(3,height).toFixed(0)} m (schematic)`:'Display height: 8 m (fallback)';$('inspector').hidden=false;});
  map.on('mouseenter','city-buildings',()=>map.getCanvas().style.cursor='pointer');map.on('mouseleave','city-buildings',()=>map.getCanvas().style.cursor='');
  $('place').onchange=()=>{const p=places[Number($('place').value)];$('district').textContent=p[0];move({center:[p[1],p[2]],zoom:p[3],pitch:60,bearing:-25});$('inspector').hidden=true;if(innerWidth<761&&!document.body.classList.contains('compact'))$('collapse').click();};
  $('home').onclick=()=>{$('place').value='0';$('place').onchange();};
  $('overview').onclick=()=>{$('district').textContent='CBD · Central Bengaluru';move({center:[77.5945,12.9755],zoom:14.8,pitch:25,bearing:0});$('inspector').hidden=true;};
  $('three').onclick=()=>move({pitch:60,zoom:Math.max(15.3,map.getZoom())});$('flat').onclick=()=>move({pitch:0,bearing:0});
  $('pitch').oninput=()=>{stopOrbit();map.setPitch(Number($('pitch').value));};
  $('buildings').onchange=()=>{map.setLayoutProperty('city-buildings','visibility',$('buildings').checked?'visible':'none');$('inspector').hidden=true;};
  $('labels').onchange=()=>{for(const l of style.layers.filter(l=>l.type==='symbol'))map.setLayoutProperty(l.id,'visibility',$('labels').checked?'visible':'none');};
  $('nature').onchange=()=>{map.setPaintProperty('water','fill-color',$('nature').checked?'#91c4d0':'#c2c8ca');map.setPaintProperty('park','fill-color',$('nature').checked?'#b0c8a0':'#e6e9e5');};
  $('orbit').onclick=()=>{if(orbit){stopOrbit();return;}if(reduced){status('Orbit disabled by your reduced-motion preference. Drag to rotate.');return;}orbit=true;$('orbit').textContent='Stop orbit';$('orbit').setAttribute('aria-pressed','true');const tick=t=>{if(!orbit)return;if(lastTime)map.setBearing(map.getBearing()+Math.min(t-lastTime,50)*.003);lastTime=t;frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);};
  $('copy').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);status('View link copied. Works wherever this app is hosted.');}catch{status('Copy the current address from your browser to save this view.');}};
 }catch(e){fail(e.message);}
}
$('close-inspector').onclick=()=>$('inspector').hidden=true;
document.addEventListener('keydown',e=>{if(e.key==='Escape'){stopOrbit();$('inspector').hidden=true;}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopOrbit();});
boot();




