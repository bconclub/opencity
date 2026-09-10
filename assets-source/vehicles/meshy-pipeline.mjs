import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
const [action='status',name='cybercab-v2']=process.argv.slice(2);
if(!/^[a-z0-9-]+$/.test(name))throw Error('Invalid asset name');
const out=join('D:/CodexTools/Meshy',name),statePath=join(out,'job.json');
const key=process.env.MESHY_API_KEY;
if(!key)throw Error('MESHY_API_KEY environment variable required');
const endpoint='https://api.meshy.ai/openapi/v1/multi-image-to-3d';
async function api(url,body){const r=await fetch(url,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});if(!r.ok)throw Error(`Meshy HTTP ${r.status}: ${(await r.text()).slice(0,500)}`);return r.json();}
await mkdir(out,{recursive:true});
let state;try{state=JSON.parse(await readFile(statePath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
if(action==='submit'){
 if(state)throw Error('Job already recorded. Inspect status; never resubmit an uncertain request.');
 const files=['front','side','rear'].map(v=>new URL(`../meshy-references/${name}/${v}.png`,import.meta.url));
 const image_urls=await Promise.all(files.map(async f=>'data:image/png;base64,'+(await readFile(f)).toString('base64')));
 state={name,submittedAt:new Date().toISOString(),status:'SUBMITTING'};
 await writeFile(statePath,JSON.stringify(state,null,2));
 const response=await api(endpoint,{image_urls,texture_image_urls:image_urls,ai_model:'meshy-7',should_texture:true,enable_pbr:true,texture_resolution:'2k',should_remesh:true,topology:'triangle',target_polycount:25000,target_formats:['glb'],image_enhancement:false});
 state.id=response.result;state.status='PENDING';await writeFile(statePath,JSON.stringify(state,null,2));
 console.log(JSON.stringify(state));
}else{
 if(!state?.id)throw Error('No recorded task ID; reconcile uncertain submission before retrying.');
 const result=await api(`${endpoint}/${state.id}`);
 state.status=result.status;state.progress=result.progress;state.consumedCredits=result.consumed_credits;state.error=result.task_error;
 if(action==='download'&&result.status==='SUCCEEDED'){
  const r=await fetch(result.model_urls.glb);if(!r.ok)throw Error(`Download HTTP ${r.status}`);
  const bytes=Buffer.from(await r.arrayBuffer());await writeFile(join(out,'source.glb'),bytes);state.bytes=bytes.length;state.modelPath=join(out,'source.glb');
 }
 await writeFile(statePath,JSON.stringify(state,null,2));console.log(JSON.stringify(state));
}
