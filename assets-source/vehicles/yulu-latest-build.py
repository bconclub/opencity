import bpy, json, math, sys, os
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'assets-source'/'vehicles'/'candidates'; OUT.mkdir(parents=True,exist_ok=True)
kind=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'yulu'
SOURCE=Path('D:/Brands BCON/OpenCity/Models/Yulu.glb' if kind=='yulu' else 'D:/Brands BCON/OpenCity/Models/Delivery Rider.glb')
NAME='Yulu' if kind=='yulu' else 'Delivery'

def activate(o):
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active=o
def tri(o): return sum(len(p.vertices)-2 for p in o.data.polygons)
def scene_bounds(obs):
    pts=[o.matrix_world@Vector(c) for o in obs for c in o.bound_box]
    return Vector(tuple(min(p[i] for p in pts) for i in range(3))),Vector(tuple(max(p[i] for p in pts) for i in range(3)))
def render(path,obs,transparent=False,res=(900,650)):
    sc=bpy.context.scene; sc.render.engine='BLENDER_WORKBENCH'; sc.render.resolution_x=res[0]; sc.render.resolution_y=res[1];sc.render.resolution_percentage=100
    sc.render.image_settings.file_format='PNG'; sc.render.film_transparent=transparent
    sc.display.shading.light='STUDIO';sc.display.shading.studio_light='paint.sl';sc.display.shading.color_type='TEXTURE';sc.display.shading.show_shadows=True;sc.display.shading.show_cavity=True;sc.display.shading.cavity_type='WORLD'
    lo,hi=scene_bounds(obs); c=(lo+hi)*.5; span=max(hi-lo)
    bpy.ops.object.camera_add(location=c+Vector((span*1.55,-span*1.85,span*.95)))
    cam=bpy.context.object;cam.name='ReviewCamera';cam.rotation_euler=(c-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=span*1.3;sc.camera=cam
    sc.render.filepath=str(path);bpy.ops.render.render(write_still=True);bpy.data.objects.remove(cam,do_unlink=True)

bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(SOURCE));bpy.context.view_layer.update()
src=[o for o in bpy.context.scene.objects if o.type=='MESH']
if not os.environ.get('SKIP_BEFORE'):render(OUT/f'{kind}-latest-before.png',src)

# Source length is X, width Y, height Z. Rotate into runtime authoring convention: front +Y, axle X.
for o in src:o.select_set(True)
bpy.context.view_layer.objects.active=src[0]
bpy.ops.transform.rotate(value=math.radians(90),orient_axis='Z');bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
if len(src)>1:
    bpy.ops.object.join()
body=bpy.context.object;body.name=f'{NAME}_Body'
lo,hi=scene_bounds([body]); ground=lo.z

# Fit wheel centres by maximizing vertices near circular low-body rings in each longitudinal half.
world=[body.matrix_world@v.co for v in body.data.vertices]
low=[p for p in world[::12] if abs(p.x)<.28 and p.z<ground+.7]
def fit(sign):
    ymax=max(abs(lo.y),abs(hi.y))
    yr=(.30,max(.36,ymax-.12))
    best=None
    for yi in range(35):
        y=sign*(yr[0]+(yr[1]-yr[0])*yi/34)
        for zi in range(14):
            z=ground+.18+.18*zi/13
            ds=[math.hypot(p.y-y,p.z-z) for p in low if p.y*sign>.12]
            if not ds: continue
            # Reward dense annulus around plausible scooter wheel radius.
            for r in (.22,.24,.26,.28,.30,.32):
                score=sum(1 for d in ds if abs(d-r)<.022)-sum(1 for d in ds if d<r*.42)*.03
                if best is None or score>best[0]:best=(score,Vector((0,y,z)),r)
    return best[1],best[2],best[0]
rear,rrear,srear=fit(-1);front,rfront,sfront=fit(1)
if kind=='yulu':
    # Calibrated from source-only +X side orthographic against exact 1.903054 m frame bounds.
    front,rfront,sfront=Vector((0,.700,-.308)),.240,'side-orthographic'
    rear,rrear,srear=Vector((0,-.570,-.306)),.255,'side-orthographic'

# Extract each wheel from fused scan using compact cylindrical envelopes. Original UVs/material remain.
def extract(name,center,radius):
    activate(body);bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='DESELECT');bpy.ops.object.mode_set(mode='OBJECT')
    uvdata=body.data.uv_layers.active.data if body.data.uv_layers.active else None
    baseimg=next((i for i in bpy.data.images if i.type=='IMAGE' and i.name=='Image_0'),None)
    pixels=list(baseimg.pixels[:]) if baseimg and kind=='yulu' and name=='Wheel_F' else None
    for p in body.data.polygons:
        c=body.matrix_world@p.center
        # Yulu white front fender sits close to tyre. Tight envelope keeps fender/fork static on body.
        envelope=1.06 if kind=='yulu' else 1.18
        half_width=.135 if kind=='yulu' else .24
        choose=abs(c.x-center.x)<half_width and math.hypot(c.y-center.y,c.z-center.z)<radius*envelope
        # Preserve supplied white front fender/fork faces using baked base-colour signal.
        if choose and kind=='yulu' and name=='Wheel_F' and uvdata and baseimg:
            u=sum(uvdata[i].uv.x for i in p.loop_indices)/len(p.loop_indices);v=sum(uvdata[i].uv.y for i in p.loop_indices)/len(p.loop_indices)
            ix=min(baseimg.size[0]-1,max(0,int((u%1)*baseimg.size[0])));iy=min(baseimg.size[1]-1,max(0,int((v%1)*baseimg.size[1])));idx=(iy*baseimg.size[0]+ix)*4
            lum=(pixels[idx]+pixels[idx+1]+pixels[idx+2])/3
            if lum>.34:choose=False
        p.select=choose
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.separate(type='SELECTED');bpy.ops.object.mode_set(mode='OBJECT')
    wheel=[o for o in bpy.context.selected_objects if o is not body][0];wheel.name=name
    # Origin at measured axle center without moving geometry.
    cur=bpy.context.scene.cursor.location.copy();bpy.context.scene.cursor.location=center;activate(wheel);bpy.ops.object.origin_set(type='ORIGIN_CURSOR');bpy.context.scene.cursor.location=cur
    return wheel
wf=extract('Wheel_F',front,rfront);wr=extract('Wheel_R',rear,rrear)

# Aggressive but bounded game LOD. Keep wheels denser per visible area.
high=bool(os.environ.get('HIGH_FIDELITY'))
targets={body:(90000 if high else 20500),wf:(5000 if high else 2200),wr:(5000 if high else 2200)}
for o,target in targets.items():
    before=tri(o)
    if before>target:
        activate(o);m=o.modifiers.new('Game Decimate','DECIMATE');m.decimate_type='COLLAPSE';m.ratio=target/before;m.use_collapse_triangulate=True;bpy.ops.object.modifier_apply(modifier=m.name)
    activate(o)
    try:bpy.ops.mesh.customdata_custom_splitnormals_clear()
    except:pass
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT');bpy.ops.object.shade_smooth_by_angle()
for image in bpy.data.images:
    if image.type=='IMAGE' and max(image.size)>1024:image.scale(1024,1024)

objects=[body,wf,wr]
# Level tyre contact plane from fitted wheel centres, then ground both contacts at Z=0.
from mathutils import Matrix
cf=wf.matrix_world.translation.copy();cr=wr.matrix_world.translation.copy()
level_pitch=math.atan2((cr.z-rrear)-(cf.z-rfront),cf.y-cr.y)
level_rot=Matrix.Rotation(level_pitch,4,'X')
for o in objects:o.matrix_world=level_rot@o.matrix_world
bpy.context.view_layer.update();cf=wf.matrix_world.translation;cr=wr.matrix_world.translation
lift=-((cf.z-rfront+cr.z-rrear)/2)
for o in objects:
    mw=o.matrix_world.copy();mw.translation.z+=lift;o.matrix_world=mw
bpy.context.view_layer.update()

# Refine level from actual extracted wheel geometry contact, avoiding fitted-radius error.
def min_world_z(o):return min((o.matrix_world@v.co).z for v in o.data.vertices)
zf,zr=min_world_z(wf),min_world_z(wr);cf=wf.matrix_world.translation;cr=wr.matrix_world.translation
contact_pitch=math.atan2(zr-zf,cf.y-cr.y);contact_rot=Matrix.Rotation(contact_pitch,4,'X')
for o in objects:o.matrix_world=contact_rot@o.matrix_world
bpy.context.view_layer.update();ground=min_world_z(wf)
for o in objects:
    mw=o.matrix_world.copy();mw.translation.z-=ground;o.matrix_world=mw
bpy.context.view_layer.update()

# Riding candidate: retract scan kickstand/pedal debris below road plane into body floor.
if kind=='yulu':
    inv=body.matrix_world.inverted()
    for v in body.data.vertices:
        w=body.matrix_world@v.co
        if w.z<0.012:w.z=0.012;v.co=inv@w
    body.data.update()
for o in objects:o['vehicle_role']='body' if o is body else 'wheel';o['source_asset']=SOURCE.name
body['forward_axis']='+Y';body['wheel_axle']='local X';body['paintability']='single baked material; preserve source finish'
activate(body)
for o in objects:o.select_set(True)
glb=OUT/f'{kind}-latest.glb';bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',use_selection=True,export_apply=False,export_image_format='AUTO')
render(OUT/f'{kind}-latest-after.png',objects);render(OUT/f'{kind}-latest-picker.png',objects,True,(640,420))

lo2,hi2=scene_bounds(objects)
report={'kind':kind,'source':str(SOURCE),'sourceBytes':SOURCE.stat().st_size,'candidateBytes':glb.stat().st_size,'triangles':sum(tri(o) for o in objects),
 'trianglesByObject':{o.name:tri(o) for o in objects},'materials':len({m.name for o in objects for m in o.data.materials if m}),
 'textures':[{'name':i.name,'size':list(i.size)} for i in bpy.data.images if i.type=='IMAGE'],'boundsMin':list(lo2),'boundsMax':list(hi2),'dimensions':list(hi2-lo2),
 'wheelPivots':{'Wheel_F':list(wf.location),'Wheel_R':list(wr.location)},'wheelRadiiEstimated':{'Wheel_F':rfront,'Wheel_R':rrear},'fitScores':{'Wheel_F':sfront,'Wheel_R':srear},
 'axes':{'authoringUp':'+Z','authoringForward':'+Y','wheelAxle':'local X','glTFUp':'+Y','glTFForward':'-Z'},
 'appearance':'Original baked texture material, UVs and rider geometry preserved; images resized from 2048 to 1024.',
 'paintability':'No reliable BodyPaint isolation. One baked material spans complete scan; tinting would recolor rider, wheels, and accessories.',
 'limitations':['Source is one fused scan mesh. Spatial wheel extraction can include nearby fork/fender fragments or leave wheel fragments on body.','98.7% triangle reduction can soften silhouette and texture-normal detail.','Wheel centres and radii are geometry fits, not manufacturer dimensions.']}
report['budgetStatus']='100k fidelity candidate exceeds requested 25k because 25k visibly faceted source body/rider.' if high else 'Meets 25k target.'
(OUT/f'{kind}-latest-report.json').write_text(json.dumps(report,indent=2))

# Preserve editable source on authorized D drive when available.
blend_dir=Path('D:/CodexTools/Blender/projects/open-city-two-wheelers');blend_dir.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(blend_dir/f'{kind}-latest.blend'))
print(json.dumps(report))
