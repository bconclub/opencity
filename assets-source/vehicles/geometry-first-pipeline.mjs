// Two-stage Meshy pipeline. Credentials stay in MESHY_API_KEY, never in job files.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
const [stage,action,name]=process.argv.slice(2);
if(!['geometry','texture'].includes(stage)||!['submit','status','download'].includes(action)||!/^[a-z0-9-]+$/.test(name||''))throw Error('Usage: node geometry-first-pipeline.mjs geometry|texture submit|status|download asset-name');
const key=process.env.MESHY_API_KEY;if(!key)throw Error('MESHY_API_KEY required');
const out=join('D:/CodexTools/Meshy',name),stateFile=join(out,`${stage}-job.json`);
await mkdir(out,{recursive:true});
const endpoint='https://api.meshy.ai/openapi/v1/'+(stage==='geometry'?'multi-image-to-3d':'retexture');
const imageData=async path=>'data:image/png;base64,'+(await readFile(path)).toString('base64');
const images=()=>Promise.all(['front','side','rear'].map(view=>imageData(new URL(`../meshy-references/${name}/${stage}/${view}.png`,import.meta.url))));
const api=async(url,body)=>{const r=await fetch(url,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});if(!r.ok)throw Error(`Meshy HTTP ${r.status}: ${(await r.text()).slice(0,400)}`);return r.json();};
let state;try{state=JSON.parse(await readFile(stateFile,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
if(action==='submit'){
 if(state)throw Error('Existing submission record. Inspect its status; never retry a POST blindly.');
 let body;
 if(stage==='geometry')body={image_urls:await images(),ai_model:'meshy-7',should_texture:false,should_remesh:true,topology:'triangle',target_polycount:100000,target_formats:['glb'],image_enhancement:false};
 else{
  const geometry=await readFile(join(out,'geometry-reviewed.glb'));
  const review=JSON.parse(await readFile(join(out,'geometry-review.json'),'utf8'));
  const sha256=createHash('sha256').update(geometry).digest('hex');
  if(review.sha256!==sha256||review.status!=='passed'||!review.evidence?.length)throw Error('Reviewed geometry hash and visual evidence required before texturing.');
  body={model_url:'data:application/octet-stream;base64,'+geometry.toString('base64'),multiview_image_urls:await images(),ai_model:'meshy-7',enable_original_uv:!!review.keepUv,enable_pbr:true,texture_resolution:'2k',target_formats:['glb']};
 }
 state={stage,name,status:'SUBMITTING',submittedAt:new Date().toISOString()};await writeFile(stateFile,JSON.stringify(state,null,2));
 const result=await api(endpoint,body);state.id=result.result;state.status='PENDING';
}else{
 if(!state?.id)throw Error('No task ID. Reconcile uncertain submission before further action.');
 const result=await api(`${endpoint}/${state.id}`);Object.assign(state,{status:result.status,progress:result.progress,consumedCredits:result.consumed_credits,error:result.task_error});
 if(action==='download'&&state.status==='SUCCEEDED'){
  const response=await fetch(result.model_urls.glb);if(!response.ok)throw Error(`Download HTTP ${response.status}`);
  const bytes=Buffer.from(await response.arrayBuffer());state.path=join(out,`${stage}-source.glb`);state.bytes=bytes.length;await writeFile(state.path,bytes);
 }
}
await writeFile(stateFile,JSON.stringify(state,null,2));console.log(JSON.stringify(state));
