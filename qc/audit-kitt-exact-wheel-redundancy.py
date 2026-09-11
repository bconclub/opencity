"""Read-only exact triangle redundancy inspection; no Blender or asset writes."""
import importlib.util, json, collections
from pathlib import Path
spec=importlib.util.spec_from_file_location('reader', 'assets-source/vehicles/optimize-kitt-wheel-only.py')
reader=importlib.util.module_from_spec(spec);spec.loader.exec_module(reader)
g,b=reader.read_glb(Path('assets/vehicles/kitt.glb'))
result=[]
for node in g['nodes']:
    if 'mesh' not in node or not node.get('name','').startswith('Wheel_'):continue
    for primitive in g['meshes'][node['mesh']]['primitives']:
        attrs={k:reader.accessor(g,b,a) for k,a in primitive['attributes'].items()}
        positions=attrs['POSITION'];indices=[x[0] for x in reader.accessor(g,b,primitive['indices'])]
        zero=[];duplicates=[];seen={};stars=collections.defaultdict(list)
        for fi in range(len(indices)//3):
            face=indices[fi*3:fi*3+3];a,c,d=[positions[i] for i in face]
            u=[c[k]-a[k] for k in range(3)];v=[d[k]-a[k] for k in range(3)]
            cross=(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])
            if cross==(0.,0.,0.):zero.append(fi)
            else:
                for j in range(3):stars[positions[face[j]]].append((positions[face[(j+1)%3]],positions[face[(j+2)%3]]))
            payload=[tuple((label,values[i]) for label,values in sorted(attrs.items())) for i in face]
            canonical=min(tuple(payload[j:]+payload[:j]) for j in range(3))
            if canonical in seen:duplicates.append([seen[canonical],fi])
            else:seen[canonical]=fi
        planar=[];collinear=[]
        for point,links in stars.items():
            neighbors={p for edge in links for p in edge}
            vectors=[tuple(p[k]-point[k] for k in range(3)) for p in neighbors]
            normal=None
            for u in vectors:
                for v in vectors:
                    n=(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])
                    if n!=(0.,0.,0.):normal=n;break
                if normal:break
            if normal is None:collinear.append(point)
            elif all(sum(normal[k]*v[k] for k in range(3))==0 for v in vectors):
                degree=collections.Counter(p for edge in links for p in edge)
                if all(n==2 for n in degree.values()):
                    centre_normals={attrs['NORMAL'][i] for i,p in enumerate(positions) if p==point}
                    boundary_normals={attrs['NORMAL'][i] for i,p in enumerate(positions) if p in neighbors}
                    planar.append({'position':point,'centre_normals':sorted(centre_normals),
                                   'boundary_normal_component_ranges':[[min(n[k] for n in boundary_normals),max(n[k] for n in boundary_normals)] for k in range(3)]})
        result.append({'node':node['name'],'triangles':len(indices)//3,
                       'exact_coplanar_interior_vertex_stars':planar,
                       'exact_collinear_vertex_stars':collinear,
                       'exact_zero_area_triangles':len(zero),'zero_area_triangle_ordinals':zero,
                       'same_winding_duplicate_triangles_with_identical_attributes':len(duplicates),
                       'duplicate_pairs':duplicates})
report={'status':'READ_ONLY_EXACT_TRIANGLE_AUDIT','meshes':result,
        'total_exact_zero_area':sum(r['exact_zero_area_triangles'] for r in result),
        'total_attribute_identical_duplicates':sum(r['same_winding_duplicate_triangles_with_identical_attributes'] for r in result),
        'scope':'Exact float-coordinate zero-area test and cyclic same-winding duplicate test with all exported vertex attributes. No tolerance-based welding or approximate coplanar simplification.'}
Path('qc/kitt-exact-wheel-redundancy.json').write_text(json.dumps(report,indent=2))
print(json.dumps({**report,'meshes':[{k:v for k,v in r.items() if k not in ('zero_area_triangle_ordinals','duplicate_pairs')} for r in result]},indent=2))
