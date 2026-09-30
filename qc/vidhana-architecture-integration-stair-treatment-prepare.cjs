const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const original=fs.readFileSync('qc/vidhana-architecture-integration-candidate.js','utf8');
function once(s,a,b){assert.equal(s.split(a).length,2,a);return s.replace(a,b);}
const architectureStart=original.indexOf('function buildArchitecture');assert(architectureStart>0);
let isolated=original.slice(0,architectureStart)+once(original.slice(architectureStart),"function material(colour,glass=false){const key=colour+'|'+glass;","function material(colour,glass=false,unique=''){const key=colour+'|'+glass+'|'+unique;");
isolated=once(isolated,'append(stairGeometry,stone,new T.Matrix4());','const stairBatch=material("#d2ccbf",false,"stairs");stairBatch.material.userData.stairSurface=true;append(stairGeometry,stairBatch,new T.Matrix4());');
isolated=once(isolated,'m.type,m.color.getHexString(),m.roughness','m.userData.stairSurface||false,m.type,m.color.getHexString(),m.roughness');
const marker=' return{group,displayParts:v.displayParts,siteDisplayBounds,extraFocusTargets,';
const filtered=`
 const stair=group.children.find(m=>m.material.userData.stairSurface);if(!stair)throw new Error('Expected isolated physical staircase');
 stair.receiveShadow=false;
 const slope=new T.Vector3(s.outward[0]*D.landingZ/D.stairDepth,s.outward[1]*D.landingZ/D.stairDepth,1).normalize(),going=D.stairDepth/D.steps,rise=D.landingZ/D.steps;
 stair.material.onBeforeCompile=shader=>{
  shader.uniforms.stairOutward={value:new T.Vector2(...s.outward)};shader.uniforms.stairLimits={value:new T.Vector2(s.topV,s.bottomV)};shader.uniforms.stairSlope={value:slope};shader.uniforms.stairStep={value:new T.Vector3(s.outward[0]*going,s.outward[1]*going,-rise)};shader.uniforms.stairViewport={value:new T.Vector2(1400,900)};stair.userData.stairShader=shader;
  shader.vertexShader='uniform vec2 stairOutward;uniform vec2 stairLimits;uniform vec3 stairSlope;uniform vec3 stairStep;uniform vec2 stairViewport;\\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>',\`#include <beginnormal_vertex>
   float stairV=dot(position.xy,stairOutward);
   if(stairV>stairLimits.x+.0001&&stairV<stairLimits.y+.0001&&(normal.z>.99||dot(normal.xy,stairOutward)>.99)){
    vec4 stairP=projectionMatrix*modelViewMatrix*vec4(position,1.0),stairQ=projectionMatrix*modelViewMatrix*vec4(position+stairStep,1.0);
    float stairPixels=length((stairP.xy/stairP.w-stairQ.xy/stairQ.w)*stairViewport*.5);
    objectNormal=normalize(mix(stairSlope,objectNormal,smoothstep(.65,2.0,stairPixels)));
   }\`);
 };
 stair.material.customProgramCacheKey=()=> 'review-stair-screen-normal-filter-v1';
 stair.onBeforeRender=renderer=>{if(stair.userData.stairShader)renderer.getDrawingBufferSize(stair.userData.stairShader.uniforms.stairViewport.value);};
`;
const modes={original,isolated,shadowOff:once(isolated,marker,' const stair=group.children.find(m=>m.material.userData.stairSurface);if(!stair)throw new Error("Expected staircase");stair.receiveShadow=false;\n'+marker),filtered:once(isolated,marker,filtered+marker)};
const entries=[];for(const[mode,body]of Object.entries(modes)){const file='qc/vidhana-architecture-integration-stair-treatment-'+mode+'.js';fs.writeFileSync(file,body);entries.push({mode,file,sha256:sha(body),bytes:Buffer.byteLength(body)});}fs.writeFileSync('qc/vidhana-architecture-integration-stair-treatment-manifest.json',JSON.stringify({original:sha(original),entries,scope:'Review only. Isolate unchanged stair mesh, test shadow reception separately, then screen-space normal filtering below2px stair-going. No AA or position/normal-buffer changes, no runtime promotion.'},null,2));console.log(JSON.stringify(entries));
