// Isolated review material. Analytic box integration over each physical step.
// Geometry remains unchanged. Standard lighting is evaluated for tread/riser
// normals independently, then blended in linear light by pixel coverage.
export function applyStairAnalyticMaterial(T,stair,s,D){
 stair.receiveShadow=false;
 stair.material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,{stairOutward:{value:new T.Vector2(...s.outward)},stairTangent:{value:new T.Vector3(...s.tangent,0)},stairLimits:{value:new T.Vector2(s.topV,s.bottomV)},stairGoing:{value:D.stairDepth/D.steps},stairRise:{value:D.landingZ/D.steps},stairViewport:{value:new T.Vector2(1400,900)}});stair.userData.stairShader=shader;
  const uniforms='uniform vec2 stairOutward;uniform vec2 stairLimits;uniform float stairGoing;uniform float stairRise;';
  const varying='varying vec3 vStairPosition;varying vec3 vStairUp;varying vec3 vStairOut;varying vec2 vStairWidths;varying float vStairFace;';
  shader.vertexShader=uniforms+varying+'uniform vec3 stairTangent;uniform vec2 stairViewport;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>',`#include <beginnormal_vertex>
   vStairPosition=position;vStairUp=normalMatrix*vec3(0.0,0.0,1.0);vStairOut=normalMatrix*vec3(stairOutward,0.0);vStairFace=(normal.z>.99||dot(normal.xy,stairOutward)>.99)?1.0:0.0;
   mat4 stairM=projectionMatrix*modelViewMatrix;
   vec4 stairP=stairM*vec4(position,1.0),stairE=stairM*vec4(position+stairTangent,1.0),stairR=stairM*vec4(position+vec3(0.0,0.0,stairRise),1.0),stairT=stairM*vec4(position+vec3(stairOutward*stairGoing,0.0),1.0);
   vec2 stairEdge=(stairE.xy/stairE.w-stairP.xy/stairP.w)*stairViewport*.5,stairPerp=vec2(-stairEdge.y,stairEdge.x)/max(length(stairEdge),.00001);
   vStairWidths=vec2(abs(dot((stairR.xy/stairR.w-stairP.xy/stairP.w)*stairViewport*.5,stairPerp)),abs(dot((stairT.xy/stairT.w-stairP.xy/stairP.w)*stairViewport*.5,stairPerp)));`);
  shader.fragmentShader=uniforms+varying+`\nfloat stairIntegral(float phase,float duty){return floor(phase)*duty+min(fract(phase),duty);}\n`+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   float stairV=dot(vStairPosition.xy,stairOutward);
   bool stairSurface=vStairFace>.99&&stairV>stairLimits.x+.0001&&stairV<=stairLimits.y+.0001;
   float stairDuty=clamp(vStairWidths.x/max(vStairWidths.x+vStairWidths.y,.00001),.0001,.9999);
   float stairPhase=(stairLimits.y-stairV)/stairGoing*(1.0-stairDuty)+vStairPosition.z/stairRise*stairDuty;
   float stairFootprint=max(fwidth(stairPhase),.0001);
   float stairCoverage=clamp((stairIntegral(stairPhase+stairFootprint*.5,stairDuty)-stairIntegral(stairPhase-stairFootprint*.5,stairDuty))/stairFootprint,0.0,1.0);
   vec3 stairSavedNormal=normal;if(stairSurface)normal=normalize(vStairUp);`);
  const lighting='#include <lights_fragment_begin>\n\t#include <lights_fragment_maps>\n\t#include <lights_fragment_end>';
  if(!shader.fragmentShader.includes(lighting))throw new Error('Unexpected Three standard lighting layout');
  shader.fragmentShader=shader.fragmentShader.replace(lighting,lighting+`
   if(stairSurface){
    ReflectedLight stairTreadLight=reflectedLight;
    reflectedLight=ReflectedLight(vec3(0.0),vec3(0.0),vec3(0.0),vec3(0.0));normal=normalize(vStairOut);
    {
     ${lighting}
    }
    reflectedLight.directDiffuse=mix(stairTreadLight.directDiffuse,reflectedLight.directDiffuse,stairCoverage);
    reflectedLight.directSpecular=mix(stairTreadLight.directSpecular,reflectedLight.directSpecular,stairCoverage);
    reflectedLight.indirectDiffuse=mix(stairTreadLight.indirectDiffuse,reflectedLight.indirectDiffuse,stairCoverage);
    reflectedLight.indirectSpecular=mix(stairTreadLight.indirectSpecular,reflectedLight.indirectSpecular,stairCoverage);
    normal=stairSavedNormal;
   }`);
 };
 stair.material.customProgramCacheKey=()=> 'review-stair-analytic-coverage-v1';
 stair.onBeforeRender=renderer=>{if(stair.userData.stairShader)renderer.getDrawingBufferSize(stair.userData.stairShader.uniforms.stairViewport.value);};
}
