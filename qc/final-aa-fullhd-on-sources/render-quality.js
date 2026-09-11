// Full-HD candidate ceiling requires its hardware release gate before promotion.
export const MAX_AA_DEVICE_PIXELS = 1920 * 1080;
// Match MapLibre5.6.1's context defaults; a hybrid driver may still choose differently.
export const MAP_POWER_PREFERENCE = 'high-performance';
const softwareRenderer = /swiftshader|llvmpipe|softpipe|software|\bwarp\b|basic render/i;
const verifiedRenderer = /Intel.*UHD Graphics\s*630.*Direct3D11/i;
const decision = (antialias, reason, pixels = null, renderer = null) => ({antialias, reason, pixels, renderer});

export function classifyRenderQuality({mobile = false, coarsePointer = false, width, height, pixelRatio, webgl2 = false, renderer, maxSamples} = {}) {
 if(mobile || coarsePointer)return decision(false,'mobile-or-coarse-pointer');
 if(![width,height,pixelRatio].every(n=>Number.isFinite(n)&&n>0))return decision(false,'unknown-pixel-size');
 const pixels=Math.ceil(width*pixelRatio)*Math.ceil(height*pixelRatio);
 if(!Number.isSafeInteger(pixels)||pixels>MAX_AA_DEVICE_PIXELS)return decision(false,'outside-pixel-budget',pixels);
 if(!webgl2)return decision(false,'webgl2-unavailable',pixels);
 if(typeof renderer!=='string'||!renderer.trim())return decision(false,'renderer-unavailable',pixels);
 if(softwareRenderer.test(renderer))return decision(false,'software-renderer',pixels,renderer);
 if(!verifiedRenderer.test(renderer))return decision(false,'unverified-renderer',pixels,renderer);
 if(!Number.isFinite(maxSamples)||maxSamples<4)return decision(false,'insufficient-multisample-support',pixels,renderer);
 return decision(true,'verified-desktop-tier',pixels,renderer);
}

// Synchronous pre-map probe. Never retains its canvas/context or throws into boot.
// No stored preference or UI override broadens the measured default.
export function chooseRenderQuality(environment = globalThis) {
 let canvas,gl,loseContext,inputs;
 try {
  const nav=environment.navigator||{},ua=nav.userAgent||'';
  inputs={mobile:nav.userAgentData?.mobile===true||/Android|iPhone|iPad|iPod|Mobile/i.test(ua)||(nav.platform==='MacIntel'&&nav.maxTouchPoints>1),coarsePointer:environment.matchMedia?.('(pointer: coarse), (any-pointer: coarse)')?.matches===true,width:environment.innerWidth,height:environment.innerHeight,pixelRatio:environment.devicePixelRatio};
  const early=classifyRenderQuality(inputs);
  if(early.reason!=='webgl2-unavailable')return early;
  canvas=environment.document.createElement('canvas');canvas.width=canvas.height=1;
  gl=canvas.getContext('webgl2',{antialias:false,alpha:true,depth:true,stencil:true,powerPreference:MAP_POWER_PREFERENCE,preserveDrawingBuffer:false,failIfMajorPerformanceCaveat:false,desynchronized:false});
  if(!gl)return early;
  loseContext=gl.getExtension('WEBGL_lose_context');
  if(typeof loseContext?.loseContext!=='function')return decision(false,'probe-release-unavailable',early.pixels);
  if(gl.isContextLost())return decision(false,'probe-context-lost',early.pixels);
  const debug=gl.getExtension('WEBGL_debug_renderer_info');
  return classifyRenderQuality({...inputs,webgl2:true,renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):null,maxSamples:gl.getParameter(gl.MAX_SAMPLES)});
 } catch {
  return decision(false,'probe-failed');
 } finally {
  // A driver or extension failure must not prevent the real map from starting.
  try{loseContext?.loseContext();}catch{}
  try{if(canvas){canvas.width=canvas.height=0;canvas.remove?.();}}catch{}
 }
}
