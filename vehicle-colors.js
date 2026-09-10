export const VEHICLE_COLORS=Object.freeze({green:'#16845f',yellow:'#edbb32',red:'#cf493a',blue:'#397cce',white:'#e8ede7',black:'#303b3e'});
export function paintHex(key){return typeof key==='string'?(VEHICLE_COLORS[key]||(/^#[0-9a-f]{6}$/i.test(key)?key:null)):null;}
export function selectedVehicleColor(){try{const key=localStorage.getItem('opencity-vehicle-color');return paintHex(key)?key:null;}catch{return null;}}
export function bindVehiclePaint(group,remote=false){
 const materials=new Set();group.traverse(o=>{for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m?.userData?.vehiclePaint)materials.add(m);});
 function setPaint(key){if(!paintHex(key))return false;for(const m of materials)m.color.set(paintHex(key));group.userData.paintColor=key;return true;}
 const change=e=>setPaint(e.detail?.color);
 if(!remote){setPaint(selectedVehicleColor());window.addEventListener('vehicle-color-change',change);}
 const disposePaint=()=>window.removeEventListener('vehicle-color-change',change);
 group.addEventListener('removed',disposePaint);
 return{setPaint,disposePaint};
}

// Legacy room servers accept six names. Local paint remains the exact hex.
export function wireVehicleColor(key){const hex=paintHex(key);if(!hex)return 'green';if(Object.hasOwn(VEHICLE_COLORS,key))return key;const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),v=rgb(hex);return Object.entries(VEHICLE_COLORS).sort((a,b)=>rgb(a[1]).reduce((n,c,i)=>n+(c-v[i])**2,0)-rgb(b[1]).reduce((n,c,i)=>n+(c-v[i])**2,0))[0][0];}
