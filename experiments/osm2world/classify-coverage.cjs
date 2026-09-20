const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {clipMesh}=require('./clip-coverage.cjs');
const sourceDir=path.join(__dirname,'coverage-500'),dir=path.join(__dirname,'coverage-500-classified');
const sourceBytes=fs.readFileSync(path.join(sourceDir,'meshes.json'));
const hash=crypto.createHash('sha256').update(sourceBytes).digest('hex');
// Immutable audit identity, not an index rule for arbitrary future conversions.
if(hash!=='ca8789d4181bc435398ac6edbab468e6c489e37eaffbef4155dc11c5912c1f3e')throw Error('Street source changed: repeat object/material audit before classifying');
const source=JSON.parse(sourceBytes),stats=JSON.parse(fs.readFileSync(path.join(sourceDir,'results.json')));
const materialProfiles=[
 {color:[77/255,77/255,77/255],role:'asphalt'},
 {color:[140/255,140/255,140/255],role:'concrete'},
 {color:[102/255,102/255,102/255],role:'paving'},
 {color:[229/255,229/255,229/255],role:'marking'},
 // Preserve these source colours. Their appearance is not inferred from red.
 {color:[77/255,0,0],role:'source'},
 {color:[200/255,200/255,200/255],role:'source'},
 {color:[1,1,1],role:'source'}
];
const objectMeshes=new Set([970,971]);
// OSM2World MetricMapProjection and MapLibre use different Earth radii.
// Convert native horizontal coordinates before clipping, retain true height.
const horizontalScale=(2*Math.PI*6371008.8)/40075016.686;
const meshes=source.map((m,i)=>{
 const profile=materialProfiles.find(p=>m.color.every((v,j)=>Math.abs(v-p.color[j])<1e-6));
 if(!profile)throw Error('Unreviewed material at source mesh '+i);
 const positions=m.positions.map((v,j)=>j%3===1?v:v*horizontalScale),normals=[];
 for(let j=0;j<m.normals.length;j+=3){const n=[m.normals[j]/horizontalScale,m.normals[j+1],m.normals[j+2]/horizontalScale],length=Math.hypot(...n)||1;normals.push(...n.map(v=>v/length));}
 return {...m,positions,normals,sourceMeshIndex:i,surfaceRole:profile.role,groundEligible:!objectMeshes.has(i)};
});
if([...objectMeshes].reduce((sum,i)=>sum+meshes[i].indices.length/3,0)!==17)throw Error('Audited furniture geometry changed');
const origin=stats.projectionOrigin,circ=2*Math.PI*6371008.8*Math.cos(origin[1]*Math.PI/180),mercY=lat=>(1-Math.asinh(Math.tan(lat*Math.PI/180))/Math.PI)/2;
const center=[(stats.selectionCenter[0]-origin[0])*circ/360,(mercY(origin[1])-mercY(stats.selectionCenter[1]))*circ];
const clipped=meshes.map(m=>clipMesh(m,center,500)).filter(m=>m.indices.length);
fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'meshes.json'),JSON.stringify(clipped));
const report={sourceSha256:hash,horizontalScale,sourceEquatorialCircumferenceM:40075016.686,targetEarthRadiusM:6371008.8,heightScale:1,sourceFurnitureMeshIndices:[970,971],furnitureTrianglesBefore:17,furnitureTrianglesAfter:clipped.filter(m=>!m.groundEligible).reduce((s,m)=>s+m.indices.length/3,0),materialProfiles,sourceMetadataAvailable:false,classification:'Hash-guarded reviewed snapshot. Material roles describe existing visual treatments; no claim of source OSM semantic identity.',selectionCenter:stats.selectionCenter,radiusM:500,origin};
if(report.furnitureTrianglesAfter!==17)throw Error('Furniture was not preserved through clipping');
fs.writeFileSync(path.join(dir,'classification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
