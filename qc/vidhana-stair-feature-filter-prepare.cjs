const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const file='qc/vidhana-architecture-integration-stair-treatment-isolated.js',original=fs.readFileSync(file,'utf8');
const marker=' return{group,displayParts:v.displayParts,siteDisplayBounds,extraFocusTargets,';
assert.equal(original.split(marker).length,2);
const filter=`
 const stair=group.children.find(m=>m.material.userData.stairSurface);if(!stair)throw new Error('Expected isolated physical staircase');
 stair.receiveShadow=false;
 const slope=new T.Vector3(s.outward[0]*D.landingZ/D.stairDepth,s.outward[1]*D.landingZ/D.stairDepth,1).normalize();
 stair.material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,{stairOutward:{value:new T.Vector2(...s.outward)},stairTangent:{value:new T.Vector3(...s.tangent,0)},stairLimits:{value:new T.Vector2(s.topV,s.bottomV)},stairSlope:{value:slope},stairGoing:{value:D.stairDepth/D.steps},stairRise:{value:D.landingZ/D.steps},stairViewport:{value:new T.Vector2(1400,900)}});stair.userData.stairShader=shader;
  shader.vertexShader='uniform vec2 stairOutward;uniform vec3 stairTangent;uniform vec2 stairLimits;uniform vec3 stairSlope;uniform float stairGoing;uniform float stairRise;uniform vec2 stairViewport;\\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>',\`#include <beginnormal_vertex>
   float stairV=dot(position.xy,stairOutward);
   if(stairV>=stairLimits.x-.001&&stairV<=stairLimits.y+.001&&(normal.z>.99||dot(normal.xy,stairOutward)>.99)){
    mat4 stairM=projectionMatrix*modelViewMatrix;
    vec4 stairP=stairM*vec4(position,1.0),stairE=stairM*vec4(position+stairTangent,1.0),stairR=stairM*vec4(position+vec3(0.0,0.0,stairRise),1.0),stairT=stairM*vec4(position+vec3(stairOutward*stairGoing,0.0),1.0);
    vec2 stairEdge=(stairE.xy/stairE.w-stairP.xy/stairP.w)*stairViewport*.5;
    vec2 stairPerp=vec2(-stairEdge.y,stairEdge.x)/max(length(stairEdge),.00001);
    float stairRiserPixels=abs(dot((stairR.xy/stairR.w-stairP.xy/stairP.w)*stairViewport*.5,stairPerp));
    float stairTreadPixels=abs(dot((stairT.xy/stairT.w-stairP.xy/stairP.w)*stairViewport*.5,stairPerp));
    float stairDetail=smoothstep(.75,2.0,min(stairRiserPixels,stairTreadPixels));
    objectNormal=normalize(mix(stairSlope,objectNormal,stairDetail));
   }\`);
 };
 stair.material.customProgramCacheKey=()=> 'review-stair-minimum-feature-filter-v2';
 stair.onBeforeRender=renderer=>{if(stair.userData.stairShader)renderer.getDrawingBufferSize(stair.userData.stairShader.uniforms.stairViewport.value);};
`;
const output='qc/vidhana-stair-feature-filter-candidate.js',body=original.replace(marker,filter+marker);fs.writeFileSync(output,body);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
fs.writeFileSync('qc/vidhana-stair-feature-filter-manifest.json',JSON.stringify({source:{file,sha256:sha(original)},candidate:{file:output,sha256:sha(body)},scope:'Review only. Preserve all45 physical steps, positions, normals, other landmarks and display metadata. Filter stair face lighting by minimum projected riser/tread width perpendicular to stair edge. Shadow reception disabled only for stair batch, matching prior shadowOff diagnostic. No AA.'},null,2));
console.log(output);
