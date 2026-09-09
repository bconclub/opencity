import {CBD_DOME as D} from './cbd-boundary.js';
export async function installDome(map){
 if(map.getLayer('cbd-dome'))return;
 const T=await import('https://unpkg.com/three@0.169.0/build/three.module.js'),scene=new T.Scene(),camera=new T.Camera();let renderer;
 const shell=new T.SphereGeometry(1,48,24,0,Math.PI*2,0,Math.PI/2);shell.rotateX(Math.PI/2);shell.scale(D.x,D.y,D.z);
 scene.add(new T.Mesh(shell,new T.MeshBasicMaterial({color:0x53c8eb,transparent:true,opacity:.028,side:T.DoubleSide,depthWrite:false})));
 const points=[];function segment(a,b){points.push(...a,...b);}const at=(theta,phi)=>[D.x*Math.cos(theta)*Math.sin(phi),D.y*Math.sin(theta)*Math.sin(phi),D.z*Math.cos(phi)];
 for(let j=1;j<=10;j++)for(let i=0;i<120;i++)segment(at(i/120*Math.PI*2,j/10*Math.PI/2),at((i+1)/120*Math.PI*2,j/10*Math.PI/2));
 for(let i=0;i<24;i++)for(let j=0;j<48;j++)segment(at(i/24*Math.PI*2,j/48*Math.PI/2),at(i/24*Math.PI*2,(j+1)/48*Math.PI/2));
 const lines=new T.BufferGeometry();lines.setAttribute('position',new T.Float32BufferAttribute(points,3));const lineMaterial=new T.LineBasicMaterial({color:0x73d9f3,transparent:true,opacity:.25,depthWrite:false});scene.add(new T.LineSegments(lines,lineMaterial));
 const m=maplibregl.MercatorCoordinate.fromLngLat([D.lng,D.lat]),scale=m.meterInMercatorCoordinateUnits(),matrix=new T.Matrix4().makeTranslation(m.x,m.y,m.z).scale(new T.Vector3(scale,-scale,scale));
 map.addLayer({id:'cbd-dome',type:'custom',renderingMode:'3d',onAdd(m,gl){renderer=new T.WebGLRenderer({canvas:m.getCanvas(),context:gl});renderer.autoClear=false;},render(gl,args){if(!window.flightState?.().active&&!window.autoState?.().active)return;camera.projectionMatrix.fromArray(args.defaultProjectionData.mainMatrix).multiply(matrix);renderer.resetState();{const submitStart=performance.now();renderer.render(scene,camera);window.recordCityRender?.('Dome',renderer,performance.now()-submitStart);}}});
 window.domeState=()=>({loaded:true,visible:!!(window.flightState?.().active||window.autoState?.().active),center:[D.lng,D.lat],radii:[D.x,D.y,D.z]});
}
