const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const baseline=fs.readFileSync('qc/street-coverage-skip-baseline.js','utf8').replaceAll('\r\n','\n'),candidate=fs.readFileSync('qc/street-coverage-skip-candidate.js','utf8');
assert.equal(fs.readFileSync('street-surface-coverage.js','utf8').replaceAll('\r\n','\n'),candidate,'Runtime must match the exact accepted candidate');
const block=s=>s.slice(s.indexOf(".replace('#include <map_fragment>',`"),s.indexOf('`);',s.indexOf(".replace('#include <map_fragment>',`"))+3),a=block(baseline),b=block(candidate);
assert.equal(candidate.replace(b,a).replace('|street-source-coverage-v2-grad-branch-review','|street-source-coverage-v1'),baseline,'Only shader block and cache key may change');
const branch=b.indexOf('if(coverageBlend>0.0)'),sample=b.indexOf('textureGrad(');assert(branch>0&&sample>branch);assert(!b.slice(branch).includes('dFdx('));assert(!b.slice(branch).includes('dFdy('));assert(b.indexOf('coverageUVDx=')<branch);assert(b.indexOf('coverageUVDy=')<branch);assert(!b.includes('texture2D('));assert.equal((b.match(/textureGrad\(/g)||[]).length,1);assert(!b.includes('diffuseColor.a='));
const three=fs.readFileSync('D:/CodexTools/OSM2World/three.module.js','utf8');assert(three.includes("versionString = '#version 300 es\\n'"));assert(three.includes('#define texture2DGradEXT textureGrad'));
const step=(e,x)=>x>=e?1:0,smooth=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
let cases=0,skipped=0,maxDifference=0;
for(const pixel of [0,.01,.179999,.18,.180001,.22,.4,.649999,.65,1,10])for(const ground of [0,.5,.998999,.999,1])for(const alpha of [0,.000099,.0001,.1,.6,1]){
 const rgb=[alpha*.1,alpha*.4,alpha*.8],diffuse=[.27,.41,.63],blend=smooth(.18,.65,pixel)*step(.999,ground),oldBlend=blend*step(.0001,alpha),expected=diffuse.map((v,i)=>v*(1-oldBlend)+(rgb[i]/Math.max(alpha,.0001))*oldBlend);let actual=[...diffuse];if(blend>0){const weight=blend*step(.0001,alpha);actual=diffuse.map((v,i)=>v*(1-weight)+(rgb[i]/Math.max(alpha,.0001))*weight);}else skipped++;
 for(let i=0;i<3;i++)maxDifference=Math.max(maxDifference,Math.abs(actual[i]-expected[i]));cases++;
}
assert.equal(maxDifference,0);
const hash=s=>crypto.createHash('sha256').update(s).digest('hex'),report={passed:true,cpuOnly:true,baselineNormalizedSHA256:hash(baseline),candidateSHA256:hash(candidate),onlyShaderAndCacheKeyChanged:true,gradientExpressionsOutsideBranch:true,explicitGradientTextureInsideBranch:true,three169GLSL300SourceContract:true,blendCases:cases,zeroBlendCasesSkipped:skipped,maxAlgebraDifference:maxDifference,limitation:'CPU source/algebra and lifecycle checks only; GPU compile, output equivalence and performance are covered separately in the browser report. Driver may still predicate texture work, so no saving is claimed.'};fs.writeFileSync('qc/street-coverage-skip-contract.json',JSON.stringify(report,null,2)+'\n');console.log(report);
