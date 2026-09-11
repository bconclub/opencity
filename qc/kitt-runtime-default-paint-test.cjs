// CPU-only tests of actual model creation and actual outgoing pose callback.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const T=await import('file:///D:/CodexTools/OSM2World/three.module.js'),root=path.resolve(__dirname,'..'),data=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
 let stored=null,storageWrites=0;
 global.localStorage={getItem:()=>stored,setItem(){storageWrites++;}};
 const colors=await import(data(fs.readFileSync(path.join(root,'vehicle-colors.js'),'utf8')));
 const originals=new Map();
 class Loader{async loadAsync(url){const id=path.basename(url,'.glb');const scene=new T.Group(),body=new T.MeshBasicMaterial({color:id==='kitt'?'#090909':id.startsWith('cybercab')?'#ddb344':'#eeeeee'});body.name='BodyPaint';scene.add(new T.Mesh(new T.BoxGeometry(1,1,1),body));const lamp=new T.MeshStandardMaterial({color:'#ff0000',emissive:'#ff0000'});lamp.name='Lamps';const scanner=new T.Mesh(new T.BoxGeometry(.1,.1,.1),lamp);scanner.name='Scanner_0';scene.add(scanner);originals.set(id,body);return{scene};}}
 global.__kittPaintTest={Loader,colors};
 const source=fs.readFileSync(path.join(root,'blender-vehicle.js'),'utf8').replace("import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';","const GLTFLoader=globalThis.__kittPaintTest.Loader;").replace("import {paintHex,selectedVehicleColor} from './vehicle-colors.js';","const {paintHex,selectedVehicleColor}=globalThis.__kittPaintTest.colors;");
 const {createBlenderVehicle}=await import(data(source));
 function paintOf(model){const values=[];model.group.traverse(o=>{if(o.isMesh&&o.material.name==='BodyPaint')values.push(o.material.color.getHexString());});assert.equal(new Set(values).size,1);return values[0];}
 const local=createBlenderVehicle(T,'kitt');await local.ready;assert.equal(paintOf(local),'303b3e');assert.equal(stored,null);assert.equal(originals.get('kitt').color.getHexString(),'090909','template was mutated');
 const remote=createBlenderVehicle(T,'kitt');remote.setPaint('black');await remote.ready;assert.equal(paintOf(remote),paintOf(local));
 const truck=createBlenderVehicle(T,'cybertruck');await truck.ready;assert.equal(paintOf(truck),'eeeeee','KITT default leaked into next vehicle');
 local.setPaint('blue');assert.equal(paintOf(local),'397cce');assert.equal(paintOf(remote),'303b3e','local paint leaked into remote instance');
 stored='red';const chosen=createBlenderVehicle(T,'kitt');await chosen.ready;assert.equal(paintOf(chosen),'cf493a','stored named choice lost to KITT default');
 stored='#12ab34';const custom=createBlenderVehicle(T,'kitt');await custom.ready;assert.equal(paintOf(custom),'12ab34','custom local hex quantized');
 const gold=createBlenderVehicle(T,'cybercab');gold.setPaint('black');await gold.ready;gold.setPaint('blue');assert.equal(paintOf(gold),'ddb344','fixed Cybercab gold was repainted');
 // A pose can arrive while its GLB is still loading: the explicit remote color
 // must win over that client's different stored choice when ready resolves.
 stored='blue';const pendingRemote=createBlenderVehicle(T,'kitt');pendingRemote.setPaint('red');await pendingRemote.ready;assert.equal(paintOf(pendingRemote),'cf493a');
 stored='not-a-color';const invalidStored=createBlenderVehicle(T,'kitt');await invalidStored.ready;assert.equal(paintOf(invalidStored),'303b3e');
 assert.equal(storageWrites,0,'model defaults must not persist a user selection');

 const client=fs.readFileSync(path.join(root,'multiplayer-client.js'),'utf8'),initial=client.match(/let vehicleColor=([^;]+);/)[1],start=client.indexOf('setInterval(()=>{if(socket?.readyState===WebSocket.OPEN'),end=client.indexOf("window.addEventListener('online'",start),callback=client.slice(start,end);
 assert(start>=0&&end>start);
 const makeWire=()=>Function('selectedVehicleColor','wireVehicleColor',`
  let vehicleColor=${initial},vehicle='spectator',tick,sent=[];
  const WebSocket={OPEN:1},socket={readyState:1,bufferedAmount:0,send:value=>sent.push(JSON.parse(value))},id='cpu-test';
  const localPose=()=>({vehicle,lng:77.59,lat:12.98,altitude:0,heading:0,pitch:0,roll:0,speed:0});
  const setInterval=fn=>{tick=fn;};
  ${callback}
  return {send(next){vehicle=next;tick();return sent.at(-1).pose;},select(value){vehicleColor=value;}};
 `)(colors.selectedVehicleColor,colors.wireVehicleColor);
 stored=null;const wire=makeWire(),sequence=['kitt','cybertruck','auto','cybercab','kitt'].map(id=>wire.send(id));assert.deepEqual(sequence.map(p=>p.color),['black','green','green','green','black']);assert.deepEqual(sequence.map(p=>p.vehicle),['kitt','cybertruck','auto','cybercab','kitt']);assert.equal(stored,null);
 stored='blue';const preferred=makeWire();assert.equal(preferred.send('kitt').color,'blue');assert.equal(preferred.send('cybertruck').color,'blue');
 stored='#12ab34';const customWire=makeWire();assert.equal(customWire.send('kitt').color,'green');assert.notEqual(customWire.send('kitt').color,'#12ab34','legacy protocol must still use six names');
 preferred.select('red');assert.equal(preferred.send('kitt').color,'red');assert.equal(preferred.send('auto').color,'red');
 assert(sequence.every(p=>Object.hasOwn(colors.VEHICLE_COLORS,p.color)));assert.equal(storageWrites,0);
 const report={passed:true,cpuOnly:true,defaultLocalPaint:'303b3e',defaultRemoteWireColor:'black',defaultVehicleSwitchColors:sequence.map(p=>({vehicle:p.vehicle,color:p.color})),storedNamedPaintPriority:true,customLocalHexPreserved:'12ab34',customWireQuantization:'green',fixedCybercabGold:true,remotePreloadPaintPriority:true,perInstanceMaterials:true,storageWrites,serverProtocolChanged:false};
 fs.writeFileSync(path.join(__dirname,'kitt-runtime-default-paint-results.json'),JSON.stringify(report,null,2)+'\n');console.log(report);
})().catch(error=>{console.error(error);process.exitCode=1;});
