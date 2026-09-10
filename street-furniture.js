// Mapped positions; fixture dimensions are original simplified reconstructions.
import {signalPhase} from './traffic-simulation.js';
export async function installStreetFurniture(map) {
  const [T, data] = await Promise.all([
    import('https://unpkg.com/three@0.169.0/build/three.module.js'),
    fetch('./assets/streets/furniture.json').then(r => { if (!r.ok) throw Error('Street furniture unavailable'); return r.json(); })
  ]);
  if (map.getLayer('street-furniture')) return;
  const scene = new T.Scene(), camera = new T.Camera();
  scene.add(new T.HemisphereLight(0xfffaf0, 0x657169, 2.1));
  const sun = new T.DirectionalLight(0xffffff, 1.2); sun.position.set(-100,-80,180); scene.add(sun);
  const origin = maplibregl.MercatorCoordinate.fromLngLat(data.center), s = origin.meterInMercatorCoordinateUnits();
  const transform = new T.Matrix4().makeTranslation(origin.x, origin.y, 0).scale(new T.Vector3(s,-s,s));
  const material = new T.MeshLambertMaterial({vertexColors:true});
  function fixture(type) {
    const positions=[], normals=[], colors=[];
    function add(g, color) {
      const flat=g.index?g.toNonIndexed():g, c=new T.Color(color);
      positions.push(...flat.attributes.position.array);normals.push(...flat.attributes.normal.array);
      for(let i=0;i<flat.attributes.position.count;i++) colors.push(c.r,c.g,c.b);
      if(flat!==g)flat.dispose();g.dispose();
    }
    function box(w,d,h,x,y,z,c) { const g=new T.BoxGeometry(w,d,h);g.translate(x,y,z);add(g,c); }
    function rod(a,b,r,c,top=r) {
      const start=new T.Vector3(...a), end=new T.Vector3(...b),delta=end.clone().sub(start);
      const g=new T.CylinderGeometry(top,r,delta.length(),8,1);
      g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()));
      g.translate(...start.add(end).multiplyScalar(.5).toArray());add(g,c);
    }
    const metal=0x45514d;
    box(.34,.34,.23,0,0,.115,0x878879);
    if(type==='signal') {
      rod([0,0,.2],[0,0,3.65],.065,metal);
      box(.43,.27,1.14,0,0,3.26,0x172524);
      box(.53,.08,1.27,0,-.15,3.26,0x303d37);
      // Dark lens housings; active lens is batched separately below.
      for(const [z,c] of [[3.59,0x922e27],[3.26,0x92702a],[2.93,0x236341]]) {
        rod([0,.137,z],[0,.17,z],.116,c);
        box(.30,.27,.045,0,.2,z+.145,0x172524);
      }
      for(let z=.5;z<2;z+=.4)rod([0,0,z],[0,0,z+.17],.068,0xc4c6af);
    } else {
      const bent=type==='bent',h=bent?7:5.1;
      rod([0,0,.2],[0,0,h],.105,metal,.065);
      rod([0,0,.25],[0,0,.85],.15,metal,.105);
      if(bent) {
        rod([0,0,h],[0,.55,h+.45],.065,metal);
        rod([0,.55,h+.45],[0,1.5,h+.50],.06,metal,.045);
        box(.34,.95,.13,0,1.55,h+.46,0x596763);
        box(.27,.78,.025,0,1.55,h+.382,0xe0e2ca);
      } else {
        rod([0,0,h],[0,0,h+.35],.22,0xd4d7be,.27);
        rod([0,0,h+.35],[0,0,h+.43],.33,metal,.15);
        rod([0,0,h+.43],[0,0,h+.68],.15,metal,0);
      }
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));return g;
  }
  const groups=['straight','bent','signal'].map(type=>{
    const items=data.items.filter(item=>(item.kind==='signal'?'signal':item.mount==='bent_mast'?'bent':'straight')===type).map(item=>{
      const p=maplibregl.MercatorCoordinate.fromLngLat(item.coordinates);
      return {...item,x:(p.x-origin.x)/s,y:(origin.y-p.y)/s};
    });
    const geometry=fixture(type), mesh=new T.InstancedMesh(geometry,material,items.length);
    mesh.frustumCulled=false;scene.add(mesh);return {items,mesh,geometry};
  });
  const signals=groups[2].items,activeLensGeometry=new T.SphereGeometry(.119,10,6),activeLensMaterial=new T.MeshBasicMaterial({color:0xffffff});
  const activeLenses=new T.InstancedMesh(activeLensGeometry,activeLensMaterial,signals.length);activeLenses.frustumCulled=false;scene.add(activeLenses);
  const phaseColours={red:new T.Color(0xff3024),amber:new T.Color(0xffbf20),green:new T.Color(0x32ff72)},phaseHeights={red:3.59,amber:3.26,green:2.93};
  let renderer,visible=0,drawCalls=0,submitMs=0;const dummy=new T.Object3D();
  map.addLayer({id:'street-furniture',type:'custom',renderingMode:'3d',
    onAdd(m,gl){renderer=new T.WebGLRenderer({canvas:m.getCanvas(),context:gl});renderer.autoClear=false;},
    render(gl,args){
      const center=maplibregl.MercatorCoordinate.fromLngLat(map.getCenter()),cx=(center.x-origin.x)/s,cy=(origin.y-center.y)/s;
      visible=0;drawCalls=0;
      for(const group of groups){let count=0;
        for(const item of group.items){if(Math.hypot(item.x-cx,item.y-cy)>850)continue;
          dummy.position.set(item.x,item.y,.12);dummy.rotation.set(0,0,-item.heading*Math.PI/180);dummy.updateMatrix();group.mesh.setMatrixAt(count++,dummy.matrix);
        }
        group.mesh.count=count;group.mesh.instanceMatrix.needsUpdate=true;visible+=count;if(count)drawCalls++;
      }
      let lenses=0;const now=Date.now()/1000;
      for(const item of signals){if(Math.hypot(item.x-cx,item.y-cy)>850)continue;const phase=signalPhase(item,now),a=item.heading*Math.PI/180;
        dummy.position.set(item.x+Math.sin(a)*.185,item.y+Math.cos(a)*.185,.12+phaseHeights[phase]);dummy.rotation.set(0,0,-a);dummy.scale.set(1,.35,1);dummy.updateMatrix();activeLenses.setMatrixAt(lenses,dummy.matrix);activeLenses.setColorAt(lenses++,phaseColours[phase]);
      }
      dummy.scale.set(1,1,1);activeLenses.count=lenses;activeLenses.instanceMatrix.needsUpdate=true;if(activeLenses.instanceColor)activeLenses.instanceColor.needsUpdate=true;if(lenses)drawCalls++;
      camera.projectionMatrix.fromArray(args.defaultProjectionData.mainMatrix).multiply(transform);
      renderer.resetState();const start=performance.now();renderer.render(scene,camera);submitMs=performance.now()-start;
      window.recordCityRender?.('Street furniture',renderer,submitMs);renderer.resetState();
    },
    onRemove(){for(const group of groups)group.geometry.dispose();activeLensGeometry.dispose();activeLensMaterial.dispose();material.dispose();renderer.dispose();}
  });
  window.streetFurnitureState=()=>({loaded:true,...data.counts,visible,drawCalls,submitMs,positionSource:'OSM nodes',signalTiming:'Simulated game cycle, not live traffic data',signalPhases:signals.map(s=>({id:s.id,phase:signalPhase(s,Date.now()/1000)})),shapeAccuracy:'Simplified original reconstruction, dimensions unverified',triangles:groups.reduce((sum,g)=>sum+g.geometry.attributes.position.count/3*g.mesh.count,0)+activeLensGeometry.index.count/3*activeLenses.count});
  return {counts:data.counts};
}
