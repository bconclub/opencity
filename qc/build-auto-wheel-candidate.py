import runpy,json,struct,pathlib,copy,hashlib
a=runpy.run_path('qc/audit-auto-wheel-components.py');j=copy.deepcopy(a['j']);binary=bytearray(a['bin']);source=pathlib.Path('assets/auto/auto-rickshaw.glb').read_bytes()
rows=[r for r in a['rows']if r['primitive']==0 and r['faces'] in (1160,680) and .449<r['size'][1]<.45 and .449<r['size'][2]<.45]
assert len(rows)==3
front=next(r for r in rows if r['center'][2]<0)
extras=[r for r in a['rows']if r['primitive']==0 and r['faces'] in (244,200) and r['min'][2]<-.85 and r['max'][1]<.7]
assert len(extras)==2
for r in extras:r['center']=front['center']
rows+=extras
def add_buffer(data):
 while len(binary)%4:binary.append(0)
 index=len(j['bufferViews']);j['bufferViews'].append({'buffer':0,'byteOffset':len(binary),'byteLength':len(data)});binary.extend(data);return index
def indices(values):
 view=add_buffer(struct.pack('<'+'H'*len(values),*values));k=len(j['accessors']);j['accessors'].append({'bufferView':view,'componentType':5123,'count':len(values),'type':'SCALAR'});return k
original=j['meshes'][0]['primitives'][0];removed=set(tuple(t)for r in rows for t in r['_triangles']);old=[v[0]for v in a['accessor'](original['indices'])];keep=[n for i in range(0,len(old),3)if tuple(old[i:i+3])not in removed for n in old[i:i+3]]
original['indices']=indices(keep);report=[];max_error=0
for r in rows:
 tag='F' if r['center'][2]<0 else 'RL' if r['center'][0]<0 else 'RR';name=('FrontFender' if r['faces']==244 else 'FrontLamp') if r in extras else 'Wheel_'+tag;used=sorted(set(n for t in r['_triangles']for n in t));remap={v:i for i,v in enumerate(used)};prim={'attributes':{},'material':original['material'],'indices':indices([remap[n]for t in r['_triangles']for n in t])}
 for attr,k in original['attributes'].items():
  ac=j['accessors'][k];bv=j['bufferViews'][ac['bufferView']];c={'VEC2':2,'VEC3':3,'VEC4':4}[ac['type']];fmt={5126:'f',5123:'H',5125:'I',5121:'B'}[ac['componentType']];size=struct.calcsize(fmt)*c;stride=bv.get('byteStride',size);offset=bv.get('byteOffset',0)+ac.get('byteOffset',0);vals=[]
  for idx in used:
   row=list(struct.unpack_from('<'+fmt*c,binary,offset+idx*stride))
   if attr=='POSITION':
    local=[v-center for v,center in zip(row,r['center'])];rounded=struct.unpack('<fff',struct.pack('<fff',*local));max_error=max(max_error,max(abs(v+center-orig)for v,center,orig in zip(rounded,r['center'],row)));row=local
   vals.append(row)
  new={k:v for k,v in ac.items()if k not in ('bufferView','byteOffset','min','max')};new['bufferView']=add_buffer(b''.join(struct.pack('<'+fmt*c,*v)for v in vals));new['count']=len(vals)
  if attr=='POSITION':new['min']=[min(v[i]for v in vals)for i in range(3)];new['max']=[max(v[i]for v in vals)for i in range(3)]
  prim['attributes'][attr]=len(j['accessors']);j['accessors'].append(new)
 j['meshes'].append({'name':name,'primitives':[prim]});j['nodes'].append({'mesh':len(j['meshes'])-1,'name':name,'translation':r['center']});j['scenes'][j.get('scene',0)]['nodes'].append(len(j['nodes'])-1)
 report.append({'name':name,'faces':r['faces'],'centerYUp':r['center'],'radius':r['size'][1]/2})
front_nodes=[i for i,n in enumerate(j['nodes'])if n['name'] in ('Wheel_F','FrontFender','FrontLamp')]
for i in front_nodes:j['nodes'][i]['translation']=[0,0,0];j['scenes'][j.get('scene',0)]['nodes'].remove(i)
j['nodes'].append({'name':'Steer_F','translation':front['center'],'children':front_nodes});j['scenes'][j.get('scene',0)]['nodes'].append(len(j['nodes'])-1)
while len(binary)%4:binary.append(0)
j['buffers'][0]['byteLength']=len(binary);jsonbytes=json.dumps(j,separators=(',',':')).encode();jsonbytes+=b' '*((-len(jsonbytes))%4);out=struct.pack('<III',0x46546c67,2,12+8+len(jsonbytes)+8+len(binary))+struct.pack('<II',len(jsonbytes),0x4e4f534a)+jsonbytes+struct.pack('<II',len(binary),0x004e4942)+binary
folder=pathlib.Path('qc/auto-wheel-candidate');folder.mkdir(exist_ok=True);(folder/'auto-rickshaw-rigged.glb').write_bytes(out)
result={'sourceSha256':hashlib.sha256(source).hexdigest(),'candidateSha256':hashlib.sha256(out).hexdigest(),'bytes':len(out),'sourceTriangles':12604,'candidateTriangles':len(keep)//3+196+sum(r['faces']for r in rows),'wheels':report,'maxRestPositionErrorMetres':max_error,'sourceBinaryPrefixPreserved':bytes(binary[:len(a['bin'])])==a['bin'],'preservation':'Connectivity-isolated wheels plus front mudguard/lamp reparented to independent spin/steer nodes. Every source triangle retained; fixed body, UVs, normals and texture bytes preserved. No remesh/decimation.'};assert result['candidateTriangles']==12604 and max_error<1e-7 and result['sourceBinaryPrefixPreserved']
(folder/'geometry.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
