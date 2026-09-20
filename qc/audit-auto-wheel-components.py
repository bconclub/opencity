import json, struct, pathlib, collections
p=pathlib.Path('assets/auto/auto-rickshaw.glb');b=p.read_bytes();n=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+n]);bin=b[28+n:]
def accessor(k):
 a=j['accessors'][k];v=j['bufferViews'][a['bufferView']];t={5126:'f',5123:'H',5125:'I',5121:'B'}[a['componentType']];c={'VEC3':3,'SCALAR':1}[a['type']];size=struct.calcsize(t)*c;offset=v.get('byteOffset',0)+a.get('byteOffset',0);stride=v.get('byteStride',size)
 return [struct.unpack_from('<'+t*c,bin,offset+i*stride) for i in range(a['count'])]
rows=[]
for mi,m in enumerate(j['meshes']):
 for pi,p in enumerate(m['primitives']):
  pts=accessor(p['attributes']['POSITION']);idx=[x[0]for x in accessor(p['indices'])];parents=list(range(len(pts)));shared={}
  def find(a):
   while parents[a]!=a:parents[a]=parents[parents[a]];a=parents[a]
   return a
  def union(a,b):parents[find(a)]=find(b)
  for i,v in enumerate(pts):
   key=tuple(round(x,5)for x in v)
   if key in shared:union(i,shared[key])
   else:shared[key]=i
  for i in range(0,len(idx),3):union(idx[i],idx[i+1]);union(idx[i],idx[i+2])
  bins=collections.defaultdict(list)
  for i in range(0,len(idx),3):bins[find(idx[i])].append(idx[i:i+3])
  for tris in bins.values():
   ids=set(sum(tris,[]));vs=[pts[i]for i in ids];lo=[min(p[k]for p in vs)for k in range(3)];hi=[max(p[k]for p in vs)for k in range(3)]
   rows.append({'primitive':pi,'faces':len(tris),'min':lo,'max':hi,'center':[(a+b)/2 for a,b in zip(lo,hi)],'size':[b-a for a,b in zip(lo,hi)],'_triangles':tris})
if __name__=='__main__':print(json.dumps([{k:v for k,v in r.items()if not k.startswith('_')}for r in sorted(rows,key=lambda x:-x['faces'])],indent=2))
