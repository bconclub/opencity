from pathlib import Path
import shutil,json
root=Path(__file__).resolve().parents[1]
stage=root/'public-asset-release'
for id,name in [('kitt','kNIGHT rIDER.glb'),('yulu','Yulu.glb'),('delivery','Delivery Rider.glb')]:
    target=root/f'assets/vehicles/{id}-original.glb'
    shutil.copyfile(Path('D:/Brands BCON/OpenCity/Models')/name,target)
    shutil.copyfile(target,stage/target.relative_to(root))
p=root/'blender-vehicle.js';s=(root/'public-asset-release/blender-vehicle.js').read_text(encoding='utf-8')
s=s.replace("const templates=new Map();", "const templates=new Map();\nconst originals={cybercab:{length:4.45,yaw:Math.PI/2},cybertruck:{length:5.683,yaw:-Math.PI/2},kitt:{length:4.8,yaw:-Math.PI/2},yulu:{length:1.9,yaw:-Math.PI/2},delivery:{length:1.9,yaw:-Math.PI/2}};")
s=s.replace("['cybertruck','cybercab','kitt'].includes(id)","Object.hasOwn(originals,id)")
s=s.replace("id==='cybertruck'?'cybertruck-original':id", "id+'-original'")
s=s.replace("['cybercab','cybertruck'].includes(id)","Object.hasOwn(originals,id)")
s=s.replace("group.userData.originalReconstruction=id==='kitt'", "group.userData.originalReconstruction=false")
s=s.replace("id==='kitt'?'Original Blender reconstruction':'Unmodified user-supplied GLB; runtime orientation and uniform scale only'", "'Unmodified user-supplied GLB; runtime orientation and uniform scale only'")
s=s.replace("id==='cybercab'?Math.PI/2:-Math.PI/2", "originals[id].yaw")
s=s.replace("(id==='cybercab'?4.45:5.683)", "originals[id].length")
p.write_text(s)
p=root/'vehicle-shell.js';s=p.read_text().replace("yulu:'Yulu-style e-bike'","yulu:'Yulu'").replace("delivery:'Delivery bike'","delivery:'Delivery scooter'")
s=s.replace("'kitt','cycle','helicopter'", "'kitt','yulu','delivery','helicopter'")
s=s.replace("cycle:'Slow down. See more.'", "cycle:'Slow down. See more.',yulu:'A lighter way through the city.',delivery:'Every street has a story.'")
s=s.replace("['cybercab','cybertruck'].includes(id)","['cybercab','cybertruck','kitt','yulu','delivery'].includes(id)")
s=s.replace("'auto','supercar','cycle'].includes(button.dataset.ride)","'auto','supercar','cycle','yulu','delivery'].includes(button.dataset.ride)")
p.write_text(s)
p=root/'sw.js';s=p.read_text().replace("const allowed=new Set", "files.push('assets/vehicles/kitt-original.glb','assets/vehicles/yulu-original.glb','assets/vehicles/delivery-original.glb','assets/vehicles/previews/yulu.webp','assets/vehicles/previews/delivery.webp');\nconst allowed=new Set");p.write_text(s)
p=root/'package.json';data=json.loads(p.read_text());data['version']='0.0.40';p.write_text(json.dumps(data,indent=2)+'\n')
(root/'release.json').write_text(json.dumps({'version':'0.0.40','date':'2026-09-14','name':'Supplied Knight Rider, Yulu and delivery scooter','versionScheme':'base-100-release-counter'})+'\n')
for name in ['blender-vehicle.js','vehicle-shell.js','vehicle-models.js','index.html','sw.js','package.json','release.json']:
    shutil.copyfile(root/name,stage/name)
for name in ['tyre-effects-review.html','tyre-effects-review.js']:
    shutil.copyfile(root/'qc'/name,stage/'qc'/name)

