import bpy, json
from pathlib import Path

SOURCE=Path(r"D:/Brands BCON/OpenCity/Models/Cyber CAB.glb")
OUT=Path(r"C:/Users/user/Documents/ChatGPT/Z/qc/cybercab-latest-components.json")
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
o=next(o for o in bpy.context.scene.objects if o.type=='MESH'); me=o.data
n=len(me.vertices); parent=list(range(n)); size=[1]*n
def find(a):
 while parent[a]!=a:
  parent[a]=parent[parent[a]]; a=parent[a]
 return a
def union(a,b):
 a=find(a); b=find(b)
 if a==b:return
 if size[a]<size[b]:a,b=b,a
 parent[b]=a;size[a]+=size[b]
for p in me.polygons:
 vs=p.vertices; a=vs[0]
 for b in vs[1:]:union(a,b)
stats={}
for v in me.vertices:
 r=find(v.index); co=v.co; s=stats.get(r)
 if s is None: stats[r]={'vertices':0,'triangles':0,'min':[co.x,co.y,co.z],'max':[co.x,co.y,co.z]};s=stats[r]
 s['vertices']+=1
 for i in range(3):s['min'][i]=min(s['min'][i],co[i]);s['max'][i]=max(s['max'][i],co[i])
for p in me.polygons:stats[find(p.vertices[0])]['triangles']+=len(p.vertices)-2
parts=sorted(stats.values(),key=lambda x:x['triangles'],reverse=True)
OUT.write_text(json.dumps({'componentCount':len(parts),'components':parts[:100]},indent=2))
print('COMPONENTS',len(parts),'TOP',json.dumps(parts[:30]),flush=True)
