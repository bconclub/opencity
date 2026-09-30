from pathlib import Path
script=(Path(__file__).parent/'cab-audit.py').read_text()
exec(script.split('scene=bpy.context.scene;')[0])
bpy.context.view_layer.objects.active=o;o.select_set(True)
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
counts={}
for tag,x,y in [('FL',-.802,1.374),('FR',.802,1.374),('RL',-.802,-1.261),('RR',.802,-1.261)]:
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
 me=o.data;coords=np.empty(len(me.vertices)*3,dtype=np.float32);me.vertices.foreach_get('co',coords);coords=coords.reshape(-1,3)
 inside=(np.abs(coords[:,0]-x)<=.11)&((coords[:,1]-y)**2+(coords[:,2]-.358)**2<=.365**2)
 idx=np.empty(len(me.loops),dtype=np.int32);me.loops.foreach_get('vertex_index',idx);mask=inside[idx.reshape(-1,3)].all(1)
 me.polygons.foreach_set('select',mask);me.update();bpy.context.tool_settings.mesh_select_mode=(False,False,True)
 before=set(bpy.context.scene.objects)
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.separate(type='SELECTED');bpy.ops.object.mode_set(mode='OBJECT')
 wheel=next(t for t in bpy.context.scene.objects if t not in before);wheel.name='Wheel_'+tag;counts[tag]=len(wheel.data.polygons)
 center=Vector((x,y,.358));spin=Matrix.Translation(center)@Matrix.Rotation(math.radians(20) if tag.startswith('F') else 0,4,'Z')@Matrix.Rotation(math.pi/2,4,'X')@Matrix.Translation(-center);wheel.matrix_world=spin@wheel.matrix_world
print('SELECTION',json.dumps(counts),flush=True)
(OUT/'cab-cylinder-test-counts.json').write_text(json.dumps(counts,indent=2))
render='scene=bpy.context.scene;'+script.split('scene=bpy.context.scene;')[1]
render=render.replace("'cab-original-","'cab-cylinder-spin-").replace("('rear',(0,-8,.7))","('quarter',(5,6,2.7))")
exec(render)
