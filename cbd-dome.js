import {CBD_DOME as D} from './cbd-boundary.js';
// A geographic cutout keeps the actual CBD footprint visible on a quiet exterior.
export function prepareCBDStyle(style){
 const ring=Array.from({length:193},(_,i)=>{const a=i/192*Math.PI*2;return[D.lng+D.x*Math.cos(a)/(111320*Math.cos(D.lat*Math.PI/180)),D.lat+D.y*Math.sin(a)/111320];});
 const inside={type:'Polygon',coordinates:[ring]};
 const field=k=>k==='$type'?['geometry-type']:k==='$id'?['id']:['get',k];
 function expression(filter){
  if(!Array.isArray(filter))return filter;
  const [op,key,...args]=filter;
  if(['all','any','none'].includes(op)){const parts=filter.slice(1).map(expression);return op==='none'?['!', ['any',...parts]]:[op,...parts];}
  if(typeof key!=='string')return filter;
  if(['==','!=','<','<=','>','>='].includes(op))return[op,field(key),...args];
  if(op==='in'||op==='!in'){const value=['in',field(key),['literal',args]];return op==='!in'?['!',value]:value;}
  if(op==='!has')return['!', ['has',key]];
  return filter;
 }
 for(const layer of style.layers){
  if(layer.type==='symbol')layer.filter=layer.filter?['all',expression(layer.filter),['within',inside]]:['within',inside];
  // The custom CBD scene replaces buildings. within does not accept polygons.
  if(layer.type==='fill-extrusion')layer.filter=['==',['literal',1],0];
 }
 // Keep the light 2D basemap outside; no opaque overlay can clip the skyline.

}
export function polygonTouchesCBD(polygon){
 const ring=(polygon[0]||[]).map(p=>[(p[0]-D.lng)*111320*Math.cos(D.lat*Math.PI/180)/D.x,(p[1]-D.lat)*111320/D.y]);
 let containsCenter=false;
 for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const a=ring[j],b=ring[i],dx=b[0]-a[0],dy=b[1]-a[1];
  const t=Math.max(0,Math.min(1,-(a[0]*dx+a[1]*dy)/(dx*dx+dy*dy||1)));
  if((a[0]+t*dx)**2+(a[1]+t*dy)**2<=1)return true;
  if((a[1]>0)!==(b[1]>0)&&0<(b[0]-a[0])*(-a[1])/(b[1]-a[1])+a[0])containsCenter=!containsCenter;
 }
 return containsCenter;
}
export async function installDome(map){
 if(map.getLayer('cbd-dome'))return;
 // Reuse mapped road data for a flat, quiet context outside the ellipse.
 const response=await fetch('./district-data.json');
 if(response.ok){const data=await response.json(),segments=[];
  const norm=p=>[(p[0]-D.lng)*111320*Math.cos(D.lat*Math.PI/180)/D.x,(p[1]-D.lat)*111320/D.y];
  for(const f of data.features){if(f.properties._layer!=='transportation'||f.geometry.type!=='LineString')continue;
   const line=f.geometry.coordinates;for(let i=1;i<line.length;i++){const a=line[i-1],b=line[i],u=norm(a),v=norm(b),dx=v[0]-u[0],dy=v[1]-u[1],aa=dx*dx+dy*dy,bb=2*(u[0]*dx+u[1]*dy),cc=u[0]*u[0]+u[1]*u[1]-1,disc=bb*bb-4*aa*cc,cuts=[0,1];
    if(aa&&disc>=0)for(const t of [(-bb-Math.sqrt(disc))/(2*aa),(-bb+Math.sqrt(disc))/(2*aa)])if(t>0&&t<1)cuts.push(t);
    cuts.sort((a,b)=>a-b);for(let j=1;j<cuts.length;j++){const t=(cuts[j-1]+cuts[j])/2;if((u[0]+dx*t)**2+(u[1]+dy*t)**2<1)continue;segments.push([cuts[j-1],cuts[j]].map(t=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]));}
   }
  }
  map.addSource('cbd-context-lines',{type:'geojson',data:{type:'Feature',properties:{},geometry:{type:'MultiLineString',coordinates:segments}}});
  map.addLayer({id:'cbd-context-lines',type:'line',source:'cbd-context-lines',paint:{'line-color':'#526764','line-width':.8,'line-opacity':.45}});
 }
 const T=await import('https://unpkg.com/three@0.169.0/build/three.module.js'),scene=new T.Scene(),camera=new T.Camera();let renderer;
 // Line-only boundary: no translucent surface washing out the skyline.
 const points=[];function segment(a,b){points.push(...a,...b);}const at=(theta,phi)=>[D.x*Math.cos(theta)*Math.sin(phi),D.y*Math.sin(theta)*Math.sin(phi),D.z*Math.cos(phi)];
 for(let j=1;j<=10;j++)for(let i=0;i<120;i++)segment(at(i/120*Math.PI*2,j/10*Math.PI/2),at((i+1)/120*Math.PI*2,j/10*Math.PI/2));
 for(let i=0;i<24;i++)for(let j=0;j<48;j++)segment(at(i/24*Math.PI*2,j/48*Math.PI/2),at(i/24*Math.PI*2,(j+1)/48*Math.PI/2));
 const lines=new T.BufferGeometry();lines.setAttribute('position',new T.Float32BufferAttribute(points,3));const lineMaterial=new T.LineBasicMaterial({color:0x73d9f3,transparent:true,opacity:.25,depthWrite:false});scene.add(new T.LineSegments(lines,lineMaterial));
 const rim=new T.Mesh(new T.RingGeometry(1-.006,1+.006,192),new T.MeshBasicMaterial({color:0x58def0,transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false}));rim.scale.set(D.x,D.y,1);rim.position.z=1;scene.add(rim);
 const m=maplibregl.MercatorCoordinate.fromLngLat([D.lng,D.lat]),scale=m.meterInMercatorCoordinateUnits(),matrix=new T.Matrix4().makeTranslation(m.x,m.y,m.z).scale(new T.Vector3(scale,-scale,scale));
 map.addLayer({id:'cbd-dome',type:'custom',renderingMode:'3d',onAdd(m,gl){renderer=new T.WebGLRenderer({canvas:m.getCanvas(),context:gl});renderer.autoClear=false;},render(gl,args){camera.projectionMatrix.fromArray(args.defaultProjectionData.mainMatrix).multiply(matrix);renderer.resetState();{const submitStart=performance.now();renderer.render(scene,camera);window.recordCityRender?.('Dome',renderer,performance.now()-submitStart);}}});
 window.domeState=()=>({loaded:true,visible:true,overview:!!window.domeOverview,center:[D.lng,D.lat],radii:[D.x,D.y,D.z]});
 const view={center:[D.lng,D.lat],zoom:innerWidth<761?13.8:14.4,pitch:55,bearing:-25};let previous,previousBounds;
 const button=document.createElement('button');button.id='dome-view-toggle';button.textContent='CBD dome';button.setAttribute('aria-pressed','false');document.getElementById('ride-brand').append(button);
 window.applyDomeOverview=()=>map.jumpTo(view);
 // Camera framing is independent of the vehicle's physics boundary.
 window.setDomeOverview=value=>{
  value=!!value;const changed=value!==!!window.domeOverview;
  if(value&&changed){previous={center:map.getCenter(),zoom:map.getZoom(),pitch:map.getPitch(),bearing:map.getBearing()};previousBounds=map.getMaxBounds();map.setMaxBounds(null);}
  window.domeOverview=value;button.setAttribute('aria-pressed',String(value));button.textContent=value?'Back to ride':'CBD dome';
  if(value)map.jumpTo(view);
  else if(changed){map.setMaxBounds(previousBounds||null);if(previous)map.jumpTo(previous);}
  if(changed)window.dispatchEvent(new Event('cbd-overview-change'));
  map.triggerRepaint();
 };
 button.onclick=()=>window.setDomeOverview(!window.domeOverview);
 // Opening framing is closer than the optional full shield overview.
 window.domeOverview=false;map.setMaxBounds(null);
 map.jumpTo({center:[D.lng,D.lat],zoom:innerWidth<761?14.6:15.1,pitch:55,bearing:-25});
}





