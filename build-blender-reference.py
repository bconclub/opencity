import bpy, json, math
from pathlib import Path
root=Path('C:/Users/user/Documents/ChatGPT/Z')
out=Path('D:/CodexTools/Blender/projects');out.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.unit_settings.system='METRIC'
scene['status']='Mapped reference massing only. Not final reconstruction.'
scene['origin_longitude']=77.5945;scene['origin_latitude']=12.9755
materials={}
data=json.loads((root/'landmark-data.json').read_text())
for f in data['features']:
 p=f['properties'];ring=f['geometry']['coordinates'][0][:-1]
 if len(ring)<3:continue
 h=float(p.get('height') or 8);base=float(p.get('min_height') or 0)
 if h<=base:continue
 xy=[((a-77.5945)*111320*math.cos(math.radians(12.9755)),(b-12.9755)*111320) for a,b,*_ in ring]
 n=len(xy);verts=[(x,y,z) for z in (base,h) for x,y in xy]
 faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
 name=p.get('site','CBD')+' | '+p.get('osm_id','part');mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
 obj=bpy.data.objects.new(name,mesh);scene.collection.objects.link(obj)
 obj['reference_only']=True;obj['source']='OpenStreetMap building parts';obj['osm_id']=p.get('osm_id','');obj['roof_shape_reference']=p.get('roof:shape','flat')
 site=p.get('site','CBD')
 if site not in materials:
  m=bpy.data.materials.new(site+' reference');m.diffuse_color=(.68,.62,.48,1) if 'Vidhana' in site else (.35,.48,.52,1);materials[site]=m
 obj.data.materials.append(materials[site])
scene['limitations']='Outer-ring shells; courtyard holes and roof profiles require reconstruction. These reference shells do not replace the game models.'
bpy.ops.wm.save_as_mainfile(filepath=str(out/'CBD-reference.blend'))
asset=root/'assets';asset.mkdir(exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(asset/'cbd-reference.glb'),export_format='GLB')
print('BLENDER_REFERENCE_EXPORTED',len(scene.objects),'objects')
