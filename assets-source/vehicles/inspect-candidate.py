import bpy
bpy.ops.wm.open_mainfile(filepath='D:/CodexTools/Blender/projects/cybercab-v2-review.blend')
for o in bpy.context.scene.objects:
 if o.type=='MESH':print('MESH',o.name,'smooth',sum(p.use_smooth for p in o.data.polygons),'polys',len(o.data.polygons),'custom',o.data.has_custom_normals)
for m in bpy.data.materials:
 if m.use_nodes:
  print('MATERIAL',m.name)
  for n in m.node_tree.nodes:
   print('NODE',n.name,n.type)
  for l in m.node_tree.links:print('LINK',l.from_node.name,l.from_socket.name,'TO',l.to_node.name,l.to_socket.name)
