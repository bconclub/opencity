"""Review-only separated Cybercab traffic LOD. Explicit execution required.

Run with Blender background CLI after the shared render/benchmark slot is released.
All Blender outputs must live on D:. Never replaces a runtime asset. No rendering.
"""
import argparse
import hashlib
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


def arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', required=True, type=Path)
    parser.add_argument('--out', required=True, type=Path)
    return parser.parse_args(sys.argv[sys.argv.index('--') + 1:])


def triangles(obj):
    obj.data.calc_loop_triangles()
    return len(obj.data.loop_triangles)


def bounds(obj):
    points = [obj.matrix_world @ v.co for v in obj.data.vertices]
    return [[min(p[a] for p in points) for a in range(3)],
            [max(p[a] for p in points) for a in range(3)]]


def mesh_object(name, vertices, faces, material):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    mesh.materials.append(material)
    for face in mesh.polygons:
        face.use_smooth = True
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def lathe(name, profile, segments, material):
    vertices = [(x, r * math.sin(j * math.tau / segments),
                 r * math.cos(j * math.tau / segments))
                for x, r in profile for j in range(segments)]
    faces = []
    for k in range(len(profile) - 1):
        for j in range(segments):
            # Outward winding for increasing axial X across the tread.
            faces.append((k * segments + j, (k + 1) * segments + j,
                          (k + 1) * segments + (j + 1) % segments,
                          k * segments + (j + 1) % segments))
    return mesh_object(name, vertices, faces, material)


def rim(material):
    n = 24
    vertices = [(.149, 0, 0)]
    for r in (.161, .322):
        x = .143 + .006 * (1 - (r / .322) ** 2)
        vertices.extend((x, r * math.sin(j * math.tau / n),
                         r * math.cos(j * math.tau / n)) for j in range(n))
    faces = [(0, 1 + (j + 1) % n, 1 + j) for j in range(n)]
    faces.extend((1 + j, 1 + (j + 1) % n, 1 + n + (j + 1) % n,
                  1 + n + j) for j in range(n))
    obj = mesh_object('RimPrototype', vertices, faces, material)
    obj.data.normals_split_custom_set([(1, 0, 0)] * len(obj.data.loops))
    return obj


def main():
    args = arguments()
    source, out = args.source.resolve(), args.out.resolve()
    if source.name != 'cybercab-rigged.glb':
        raise ValueError('Expected the accepted separated player source')
    if out.drive.upper() != 'D:':
        raise ValueError('Blender outputs must remain on D:')
    if source.parent == out or source == out / 'npc-cybercab-separated-candidate.glb':
        raise ValueError('Output must be isolated from source')
    source_sha = hashlib.sha256(source.read_bytes()).hexdigest()
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(source))
    bpy.context.view_layer.update()
    original = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    wheels = {name: bpy.data.objects.get(name)
              for name in ('Wheel_FL', 'Wheel_FR', 'Wheel_RL', 'Wheel_RR')}
    if any(o is None for o in wheels.values()):
        raise ValueError('Four named source wheel pivots required')
    expected = {'Wheel_FL': (-.78, 1.405, .365), 'Wheel_FR': (.78, 1.405, .365),
                'Wheel_RL': (-.78, -1.367, .365), 'Wheel_RR': (.78, -1.367, .365)}
    centres = {name: o.matrix_world.translation.copy() for name, o in wheels.items()}
    if any((centres[name] - Vector(expected[name])).length > 1e-5 for name in wheels):
        raise ValueError('Source pivot coordinates differ from audited source')
    body_candidates = [o for o in original if any(m and m.name == 'Material_0'
                                                  for m in o.data.materials)]
    if len(body_candidates) != 1:
        raise ValueError('Expected one separately authored fixed exterior')
    body = body_candidates[0]
    rubber = bpy.data.materials.get('ReplacementRubberAndHiddenLiners')
    gold = bpy.data.materials.get('ReplacementGoldRims')
    if rubber is None or gold is None:
        raise ValueError('Expected source wheel materials')
    source_bounds = bounds(body)
    original_body_triangles = triangles(body)
    uv_names = [layer.name for layer in body.data.uv_layers]
    image_sizes = {image.name: list(image.size) for image in bpy.data.images
                   if image.type == 'IMAGE'}
    # Reduce only the already-separated fixed body. UVs/materials stay attached;
    # texture distortion and silhouette error still require visual review.
    bpy.context.view_layer.objects.active = body
    body.select_set(True)
    modifier = body.modifiers.new('TrafficBodyBudget', 'DECIMATE')
    modifier.decimate_type = 'COLLAPSE'
    modifier.ratio = min(1.0, 4556 / original_body_triangles)
    modifier.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    body.name = 'Body_Fixed'
    body['npc_batch'] = 'fixed_body'
    if [layer.name for layer in body.data.uv_layers] != uv_names:
        raise ValueError('Body UV layer loss')
    for obj in original:
        if obj != body:
            bpy.data.objects.remove(obj, do_unlink=True)

    tyre_proto = lathe('TyrePrototype', [(-.13, .302), (-.095, .359),
                       (-.07, .365), (.075, .365), (.137, .300)], 24, rubber)
    liner_proto = lathe('LinerPrototype', [(-.15, 0), (-.15, .383),
                        (.066, .383), (.066, .363)], 16, rubber)
    rim_proto = rim(gold)
    prototypes = [tyre_proto, liner_proto, rim_proto]
    parts = [body]
    for name, centre in centres.items():
        pivot = bpy.data.objects.new(name, None)
        bpy.context.collection.objects.link(pivot)
        pivot.location = centre
        pivot['npc_role'] = 'wheel_pivot'
        pivot['radius_metres'] = .365
        parts.append(pivot)
        for proto, role in ((tyre_proto, 'tyre'), (rim_proto, 'rim'),
                            (liner_proto, 'fixed_liner')):
            obj = bpy.data.objects.new(role.title() + '_' + name, proto.data)
            bpy.context.collection.objects.link(obj)
            obj['npc_batch'] = role
            if role == 'fixed_liner':
                obj.location = centre
            else:
                obj.parent = pivot
            # Proper rotation gives a shared positive-determinant prototype.
            obj.rotation_euler.z = math.pi if centre.x < 0 else 0
            parts.append(obj)
    for proto in prototypes:
        bpy.data.objects.remove(proto, do_unlink=True)
    bpy.context.view_layer.update()
    mesh_parts = [o for o in parts if o.type == 'MESH']
    total = sum(triangles(o) for o in mesh_parts)
    if total > 6000:
        raise ValueError(f'LOD budget exceeded: {total}; no export written')
    if len({m for o in mesh_parts for m in o.data.materials}) != 3:
        raise ValueError('Unexpected material count')
    out.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in parts:
        obj.select_set(True)
    destination = out / 'npc-cybercab-separated-candidate.glb'
    if destination.exists():
        raise FileExistsError('Use a fresh review directory; no silent overwrite')
    bpy.ops.export_scene.gltf(filepath=str(destination), export_format='GLB',
                             use_selection=True, export_yup=True, export_extras=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(out / 'npc-cybercab-separated-candidate.blend'))
    report = {'status': 'PENDING_VISUAL_AND_EXPORTED_RIG_REVIEW',
              'source': str(source), 'source_sha256': source_sha,
              'triangles': total, 'materials': 3, 'planned_shared_draws': 4,
              'source_body_triangles': original_body_triangles,
              'body_triangles': triangles(body), 'body_bounds_before': source_bounds,
              'body_bounds_after': bounds(body), 'uv_layers': uv_names,
              'source_image_sizes': image_sizes,
              'blender_pivots': {n: list(c) for n, c in centres.items()},
              'wheel_radius_metres': .365,
              'limitations': 'Body decimation alters vertices and interpolates UVs. '
                             'No texture edits requested; exported image payload identity '
                             'and visual fidelity require independent validation.'}
    (out / 'candidate-build-audit.json').write_text(json.dumps(report, indent=2))
    if hashlib.sha256(source.read_bytes()).hexdigest() != source_sha:
        raise RuntimeError('Source hash changed during build')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
