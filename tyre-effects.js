const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const powered=new Set(['auto','cybertruck','cybercab','kitt','supercar','bike','delivery']);

// Arcade traction cues, not a replacement for the driving collision/velocity model.
export function tyreSlip(state,input,previousSpeed,dt,vehicle){
 if(!(dt>0)||dt>.2||state.surface!=='road')return {launch:0,brake:0,corner:0};
 const speed=Math.abs(state.speed),grip=Math.max(1,state.profile?.grip||7.5);
 const acceleration=(speed-Math.abs(previousSpeed))/dt;
 const braking=!!input.brake||(input.reverse>0&&previousSpeed>.2)||(input.throttle>0&&previousSpeed<-.2);
 const launch=powered.has(vehicle)&&input.throttle>.8&&!braking&&state.speed>=0&&speed<9
  ?clamp((acceleration/grip-.72)*2.2)*clamp((9-speed)/4):0;
 const brake=braking&&speed>2?clamp((-acceleration/grip-.55)*1.6):0;
 const a=state.heading*Math.PI/180,lateral=Math.abs(state.vx*Math.cos(a)-state.vy*Math.sin(a));
 const demand=speed*speed*Math.abs(Math.tan(state.steer||0))/Math.max(.5,state.profile?.wheelbase||2);
 const corner=speed>4?clamp(Math.max(lateral/3,(demand/grip-.9)*.6)):0;
 return {launch,brake,corner};
}

// Fixed-size ring: one draw call, no texture download, no growing scene graph.
export function createTyreEffects(T,{capacity=768,onRoad=()=>true,heightAt=()=>0}={}){
 const positions=new Float32Array(capacity*18),uvs=new Float32Array(capacity*12);
 const births=new Float32Array(capacity*6),strengths=new Float32Array(capacity*6);
 const geometry=new T.BufferGeometry();
 for(const [name,array,size]of [['position',positions,3],['uv',uvs,2],['birth',births,1],['strength',strengths,1]])
  geometry.setAttribute(name,new T.BufferAttribute(array,size).setUsage(T.DynamicDrawUsage));
 geometry.setDrawRange(0,0);
 const material=new T.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,
  polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,
  uniforms:{clock:{value:0}},
  vertexShader:`attribute float birth; attribute float strength; varying vec2 markUv; varying float age; varying float ink; uniform float clock;
   void main(){markUv=uv;age=clock-birth;ink=strength;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`varying vec2 markUv; varying float age; varying float ink;
   void main(){float edge=smoothstep(0.0,0.13,markUv.x)*(1.0-smoothstep(0.87,1.0,markUv.x));
    float tread=0.83+0.17*sin(markUv.x*65.0);float fade=1.0-smoothstep(14.0,24.0,age);
    float alpha=edge*tread*fade*ink*0.57;if(alpha<0.004)discard;gl_FragColor=vec4(vec3(0.028),alpha);}`});
 const mesh=new T.Mesh(geometry,material);mesh.name='Fading tyre tracks';mesh.frustumCulled=false;
 let contacts=[],previous=null,clock=0,cursor=0,count=0,total=0,slipAngle=0,lastSpeed=0,vehicle='auto';
 let lastSlip={launch:0,brake:0,corner:0};
 const scratch=new T.Vector3();
 function setVehicle(model,id){
  vehicle=id;model.group.updateWorldMatrix(true,true);const inverse=model.group.matrixWorld.clone().invert();
  const rigContacts=model.getWheelContacts?.();
  contacts=rigContacts?.length?rigContacts.map(p=>({x:p.x,y:p.y,width:clamp(p.width*.8,.06,.34)})):
   model.wheels.map(w=>{w.getWorldPosition(scratch).applyMatrix4(inverse);return{x:scratch.x,y:scratch.y,width:['cycle','yulu','bike','delivery'].includes(id)?.07:id==='auto'?.13:.23};});
  const middle=contacts.length?(Math.max(...contacts.map(p=>p.y))+Math.min(...contacts.map(p=>p.y)))/2:0;
  contacts.forEach(p=>p.rear=p.y<middle);reset();
 }
 function reset(){previous=null;clock=cursor=count=total=slipAngle=lastSpeed=0;lastSlip={launch:0,brake:0,corner:0};geometry.setDrawRange(0,0);material.uniforms.clock.value=0;}
 function breakTrail(){previous=null;}
 function point(s,p){const a=s.heading*Math.PI/180,c=Math.cos(a),v=Math.sin(a);return{x:s.x+c*p.x+v*p.y,y:s.y-v*p.x+c*p.y};}
 function segment(a,b,width,ink){
  const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);if(length<.025||length>3)return;
  if(![a,b,{x:(a.x+b.x)/2,y:(a.y+b.y)/2}].every(p=>onRoad(p.x,p.y)))return;
  const za=heightAt(a.x,a.y),zb=heightAt(b.x,b.y);
  // Don't bridge steps, kerbs, missing geometry or discontinuities.
  if(!Number.isFinite(za)||!Number.isFinite(zb)||Math.abs(zb-za)>.08)return;
  const ox=-dy/length*width/2,oy=dx/length*width/2;
  const corners=[[a.x+ox,a.y+oy,za+.025],[a.x-ox,a.y-oy,za+.025],[b.x+ox,b.y+oy,zb+.025],[b.x-ox,b.y-oy,zb+.025]];
  const order=[0,1,2,2,1,3],coords=[[0,0],[1,0],[0,1],[1,1]],base=cursor*6;
  order.forEach((j,i)=>{positions.set(corners[j],(base+i)*3);uvs.set(coords[j],(base+i)*2);births[base+i]=clock;strengths[base+i]=ink;});
  cursor=(cursor+1)%capacity;count=Math.min(capacity,count+1);total++;
 }
 function update(state,input,dt){
  if(!(dt>0)||dt>.2){breakTrail();return;}
  clock+=dt;material.uniforms.clock.value=clock;
  const slip=tyreSlip(state,input,lastSpeed,dt,vehicle);lastSpeed=state.speed;lastSlip=slip;
  const points=contacts.map(p=>point(state,p)),prior=previous;
  const moved=prior?Math.hypot(state.x-prior.x,state.y-prior.y):0;
  const active=Math.max(slip.launch,slip.brake,slip.corner)>.06;
  if(active&&prior&&moved>.025&&moved<3){
   // Rear wheels spin above road speed only during a traction-limited launch.
   slipAngle+=slip.launch*dt*16;
   const before=total;
   contacts.forEach((p,i)=>{const ink=Math.max(p.rear?slip.launch:0,slip.brake,slip.corner);if(ink>.06)segment(prior.points[i],points[i],p.width,ink);});
   if(total!==before){for(const name of ['position','uv','birth','strength'])geometry.attributes[name].needsUpdate=true;geometry.setDrawRange(0,count*6);}
  }
  // Retain subpixel movement until a useful strip can be emitted.
  if(!prior||!active||moved>.025)previous={x:state.x,y:state.y,points};
 }
 return {mesh,setVehicle,reset,breakTrail,update,get slipAngle(){return slipAngle;},
  state:()=>({segments:count,totalSegments:total,capacity,contacts:contacts.length,slipAngle,slip:{...lastSlip},clock}),
  dispose(){mesh.removeFromParent();geometry.dispose();material.dispose();}};
}
