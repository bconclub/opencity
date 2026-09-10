const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const p=await b.newPage({viewport:{width:1000,height:800}});await p.goto('http://127.0.0.1:4173');
  const info=await p.evaluate(async()=>{
   const T=await import('https://unpkg.com/three@0.169.0/build/three.module.js');
   const {createDrone}=await import('./drone-model.js');const d=createDrone(T);
   let meshes=0,finite=true;d.group.traverse(o=>{if(o.isMesh){meshes++;for(const x of o.geometry.attributes.position.array)if(!Number.isFinite(x))finite=false;}});
   const scene=new T.Scene();scene.add(d.group,new T.HemisphereLight(0xffffff,0x555555,2));const light=new T.DirectionalLight(0xffffff,3);light.position.set(2,3,4);scene.add(light);
   const r=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});r.setSize(1000,800);r.setClearColor(0x27343d);document.body.replaceChildren(r.domElement);document.body.style.margin=0;
   const c=new T.PerspectiveCamera(36,1.25,.01,20);c.up.set(0,0,1);c.position.set(1.5,1.9,1.4);c.lookAt(0,0,.25);r.render(scene,c);
   return {meshes,finite,rotors:d.rotors.length,directions:d.rotorDirections,size:new T.Box3().setFromObject(d.group).getSize(new T.Vector3()).toArray(),calls:r.info.render.calls,triangles:r.info.render.triangles};
  });
  assert.equal(info.rotors,4);assert.equal(info.finite,true);assert.deepEqual(info.directions,[-1,1,-1,1]);assert(info.size[0]<2&&info.size[2]<1);
  await p.screenshot({path:'D:/CodexTools/Blender/projects/drone/runtime-preview.png'});
  const glb=fs.readFileSync('assets/drone/opencity-drone.glb');assert.equal(glb.toString('ascii',0,4),'glTF');
  const json=JSON.parse(glb.toString('utf8',20,20+glb.readUInt32LE(12)));assert(json.animations.length>=1);assert(json.nodes.filter(x=>/^Propeller /.test(x.name||'')).length===4);
  console.log(JSON.stringify({...info,glbBytes:glb.length,animationClips:json.animations.length}));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});

