"""Review-only separated Cybercab traffic LOD. Explicit execution required.

Run with Blender background CLI after the shared render/benchmark slot is released.
All Blender outputs must live on D:. Never replaces a runtime asset. No rendering.
"""
import argparse
import hashlib
import json
import math
import struct
import sys
from pathlib import Path

import bpy
from mathutils import Vector, Matrix, Quaternion


def arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', required=True, type=Path)
    parser.add_argument('--out', required=True, type=Path)
    return parser.parse_args(sys.argv[sys.argv.index('--') + 1:])


def triangles(obj):
    obj.data.calc_loop_triangles()
    return len(obj.data.loop_triangles)


def embedded_image_hashes(path):
    data = path.read_bytes()
    length = struct.unpack_from('<I', data, 12)[0]
    document = json.loads(data[20:20 + length])
    binary = data[28 + length:]
    result = []
    for image in document.get('images', []):
        if 'bufferView' not in image:
            raise ValueError('Expected embedded source images')
        view = document['bufferViews'][image['bufferView']]
        start = view.get('byteOffset', 0)
        result.append(hashlib.sha256(binary[start:start + view['byteLength']]).hexdigest())
    return sorted(result)


def validate_export(path, expected_centres, expected_bounds):
    data = path.read_bytes()
    length = struct.unpack_from('<I', data, 12)[0]
    document = json.loads(data[20:20 + length])
    binary = data[28 + length:]
    nodes = document['nodes']
    wheel_names = [n.get('name', '') for n in nodes if n.get('name', '').startswith('Wheel_')]
    if sorted(wheel_names) != sorted(expected_centres):
        raise ValueError(f'Exported wheel names invalid: {wheel_names}')
    vertices, exported_centres = [], {}

    def walk(index, parent):
        node = nodes[index]
        if 'matrix' in node:
            values = node['matrix']
            local = Matrix([[values[c * 4 + r] for c in range(4)] for r in range(4)])
        else:
            rotation = node.get('rotation', [0, 0, 0, 1])
            local = Matrix.LocRotScale(Vector(node.get('translation', [0, 0, 0])),
                                       Quaternion((rotation[3], *rotation[:3])),
                                       Vector(node.get('scale', [1, 1, 1])))
        world = parent @ local

        def blender_coordinates(point):
            return Vector((point.x, -point.z, point.y))

        if node.get('name') in expected_centres:
            exported_centres[node['name']] = blender_coordinates(world.translation)
        if 'mesh' in node:
            for primitive in document['meshes'][node['mesh']]['primitives']:
                accessor = document['accessors'][primitive['attributes']['POSITION']]
                if accessor['componentType'] != 5126 or accessor['type'] != 'VEC3':
                    raise ValueError('Unexpected exported position encoding')
                view = document['bufferViews'][accessor['bufferView']]
                start = view.get('byteOffset', 0) + accessor.get('byteOffset', 0)
                stride = view.get('byteStride', 12)
                vertices.extend(blender_coordinates(world @ Vector(struct.unpack_from('<3f', binary, start + i * stride)))
                                for i in range(accessor['count']))
        for child in node.get('children', []):
            walk(child, world)

    for index in document['scenes'][document.get('scene', 0)]['nodes']:
        walk(index, Matrix.Identity(4))
    measured = [[min(p[a] for p in vertices) for a in range(3)],
                [max(p[a] for p in vertices) for a in range(3)]]
    bound_error = max(abs(measured[i][a] - expected_bounds[i][a]) for i in range(2) for a in range(3))
    pivot_error = max((exported_centres[name] - centre).length for name, centre in expected_centres.items())
    if bound_error > 1e-5 or pivot_error > 1e-5:
        raise ValueError(f'Export transform mismatch: bounds={bound_error}, pivots={pivot_error}')
    return {'wheel_names': wheel_names, 'bounds_blender_axes': measured,
            'max_bound_error_metres': bound_error, 'max_pivot_error_metres': pivot_error}


def bounds(obj):
    # Export omits loose vertices; compare the rendered surface, not unused data.
    used = {index for polygon in obj.data.polygons for index in polygon.vertices}
    points = [obj.matrix_world @ obj.data.vertices[index].co for index in used]
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
    source_images = embedded_image_hashes(source)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(source))
    bpy.context.view_layer.update()
    original = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    old_wheel_empties = [o for o in bpy.context.scene.objects
                        if o.type == 'EMPTY' and o.name.startswith('Wheel_')]
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
    # Keep imported world placement while making source transform ancestors irrelevant.
    body_world = body.matrix_world.copy()
    body.parent = None
    body.matrix_world = body_world
    bpy.context.view_layer.update()
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
    for obj in old_wheel_empties:
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
        if pivot.name != name:
            raise ValueError(f'Pivot name collision: requested {name}, received {pivot.name}')
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
    part_bounds = [bounds(o) for o in mesh_parts]
    expected_export_bounds = [[min(b[0][a] for b in part_bounds) for a in range(3)],
                              [max(b[1][a] for b in part_bounds) for a in range(3)]]
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
    export_validation = validate_export(destination, centres, expected_export_bounds)
    candidate_images = embedded_image_hashes(destination)
    bpy.ops.wm.save_as_mainfile(filepath=str(out / 'npc-cybercab-separated-candidate.blend'))
    report = {'status': 'PENDING_VISUAL_AND_EXPORTED_RIG_REVIEW',
              'source': str(source), 'source_sha256': source_sha,
              'triangles': total, 'materials': 3, 'planned_shared_draws': 4,
              'source_body_triangles': original_body_triangles,
              'body_triangles': triangles(body), 'body_bounds_before': source_bounds,
              'body_bounds_after': bounds(body), 'uv_layers': uv_names,
              'source_image_sizes': image_sizes,
              'source_image_payload_sha256': source_images,
              'candidate_image_payload_sha256': candidate_images,
              'export_transform_validation': export_validation,
              'image_payloads_identical': source_images == candidate_images,
              'blender_pivots': {n: list(c) for n, c in centres.items()},
              'wheel_radius_metres': .365,
              'limitations': 'Body decimation alters vertices and interpolates UVs. '
                             'No texture edits requested; exported image payload identity '
                             'and visual fidelity require independent validation.'}
    (out / 'candidate-build-audit.json').write_text(json.dumps(report, indent=2))
    if hashlib.sha256(source.read_bytes()).hexdigest() != source_sha:
        raise RuntimeError('Source hash changed during build')
    if source_images != candidate_images:
        raise RuntimeError('Candidate image payloads changed; candidate is not eligible for acceptance')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
