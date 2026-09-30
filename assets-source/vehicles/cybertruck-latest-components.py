import bpy,json
from pathlib import Path
SOURCE=Path(r'D:/Brands BCON/OpenCity/Models/cYBER tRUCK.glb');ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'assets/vehicles/cybertruck-latest-qc'
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(SOURCE));o=next(o for o in bpy.context.scene.objects if o.type=='MESH');me=o.data
n=len(me.vertices);parent=list(range(n));size=[1]*n
def find(a):
 while parent[a]!=a: parent[a]=parent[parent[a]];a=parent[a]
 return a
def union(a,b):
 a=find(a);b=find(b)
 if a==b:return
 if size[a]<size[b]:a,b=b,a
 parent[b]=a;size[a]+=size[b]
for p in me.polygons:
 vs=p.vertices;union(vs[0],vs[1]);union(vs[0],vs[2])
stats={}
for i,v in enumerate(me.vertices):
 r=find(i);s=stats.setdefault(r,{'vertices':0,'triangles':0,'min':[1e9]*3,'max':[-1e9]*3});s['vertices']+=1
 co=o.matrix_world@v.co
 for j in range(3):s['min'][j]=min(s['min'][j],co[j]);s['max'][j]=max(s['max'][j],co[j])
for p in me.polygons:stats[find(p.vertices[0])]['triangles']+=1
parts=sorted(stats.values(),key=lambda s:s['triangles'],reverse=True)
(OUT/'cybertruck-latest-components.json').write_text(json.dumps({'count':len(parts),'largest':parts[:100]},indent=2)+'\n');print('components',len(parts),json.dumps(parts[:20]))
