const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1000,height:700},serviceWorkers:'block'});await page.route('**/local-cache.js',r=>r.fulfill({contentType:'text/javascript',body:''}));await page.goto('http://127.0.0.1:4173');
 const result=await page.evaluate(async()=>{const T=await import('https://unpkg.com/three@0.169.0/build/three.module.js');const {createCycle}=await import('./cycle-model.js');const cycle=createCycle(T);
 document.body.innerHTML='';const r=new T.WebGLRenderer({antialias:true});r.setSize(1000,700);r.setClearColor(0xe7ece7);document.body.append(r.domElement);
 const s=new T.Scene();s.add(cycle.group,new T.HemisphereLight(0xffffff,0x465044,2));const sun=new T.DirectionalLight(0xffffff,3);sun.position.set(3,-2,5);s.add(sun);
 const c=new T.PerspectiveCamera(36,1000/700,.01,100);c.up.set(0,0,1);c.position.set(3,-2,1.9);c.lookAt(0,0,.55);r.render(s,c);
 const size=new T.Box3().setFromObject(cycle.group).getSize(new T.Vector3()).toArray();if(size[0]>.8||size[1]<1.6||size[1]>2||size[2]<1)throw Error('Unexpected dimensions '+size);
 if(cycle.wheels.length!==2||cycle.frontWheel.parent!==cycle.steering)throw Error('Animation parts missing');
 const nodes=[];cycle.group.traverse(o=>{o.updateMatrix();const node={id:o.id,parent:o.parent?.id,name:o.name||o.type,matrix:o.matrix.toArray()};if(o.geometry){const g=o.geometry;node.positions=Array.from(g.attributes.position.array);node.indices=g.index?Array.from(g.index.array):null;node.lines=o.isLineSegments||false;node.color=o.material.color.toArray();node.roughness=o.material.roughness??.6;node.metalness=o.material.metalness??0;}nodes.push(node);});return{size,calls:r.info.render.calls,triangles:r.info.render.triangles,nodes};});
 await page.screenshot({path:'D:/CodexTools/Blender/cycle-asset-preview.png'});fs.writeFileSync('D:/CodexTools/Blender/cycle-mesh.json',JSON.stringify(result.nodes));delete result.nodes;console.log(JSON.stringify(result));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});

