"""Add emissive front/rear lamp strips to cybercab-rigged.glb from body geometry.

Derived from Body_FixedFenders bounds — not runtime proxy geometry.
Run: python3 repair-cybercab-lamps-glb.py [input.glb] [output.glb]
"""
import json, struct, sys
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
IN_PATH = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'assets/vehicles/cybercab-rigged.glb'
OUT_PATH = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / 'assets/vehicles/cybercab-rigged.glb'


def read_glb(path):
    data = path.read_bytes()
    assert data[:4] == b'glTF'
    jlen = struct.unpack('<I', data[12:16])[0]
    gltf = json.loads(data[20:20 + jlen])
    bin_start = 20 + jlen + 8
    bin_data = bytearray(data[bin_start:])
    return gltf, bin_data


def write_glb(path, gltf, bin_data):
    json_bytes = json.dumps(gltf, separators=(',', ':')).encode()
    while len(json_bytes) % 4:
        json_bytes += b' '
    bin_bytes = bytes(bin_data)
    while len(bin_bytes) % 4:
        bin_bytes += b'\x00'
    total = 12 + 8 + len(json_bytes) + 8 + len(bin_bytes)
    out = bytearray()
    out += b'glTF'
    out += struct.pack('<I', 2)
    out += struct.pack('<I', total)
    out += struct.pack('<I', len(json_bytes))
    out += b'JSON'
    out += json_bytes
    out += struct.pack('<I', len(bin_bytes))
    out += b'BIN\x00'
    out += bin_bytes
    path.write_bytes(out)


def read_positions(gltf, bin_data, mesh_idx):
    prim = gltf['meshes'][mesh_idx]['primitives'][0]
    acc = gltf['accessors'][prim['attributes']['POSITION']]
    bv = gltf['bufferViews'][acc['bufferView']]
    start = bv.get('byteOffset', 0) + acc.get('byteOffset', 0)
    count = acc['count']
    arr = np.frombuffer(bin_data, dtype=np.float32, count=count * 3, offset=start).reshape(count, 3)
    return arr


def append_buffer(gltf, bin_data, array, target=34962):
    raw = np.asarray(array, dtype=np.float32).tobytes()
    offset = len(bin_data)
    bin_data.extend(raw)
    bv_idx = len(gltf['bufferViews'])
    gltf['bufferViews'].append({'buffer': 0, 'byteOffset': offset, 'byteLength': len(raw), 'target': target})
    acc_idx = len(gltf['accessors'])
    n = len(array) if array.ndim == 1 else len(array)
    entry = {'bufferView': bv_idx, 'componentType': 5126, 'count': n, 'type': 'VEC3' if array.ndim == 2 and array.shape[1] == 3 else 'SCALAR'}
    if array.ndim == 2 and array.shape[1] == 3:
        entry['min'] = array.min(axis=0).tolist()
        entry['max'] = array.max(axis=0).tolist()
    gltf['accessors'].append(entry)
    return acc_idx


def make_box(center, size):
    cx, cy, cz = center
    hw, hh, hd = [s / 2 for s in size]
    verts = np.array([
        [cx - hw, cy - hh, cz - hd], [cx + hw, cy - hh, cz - hd],
        [cx + hw, cy + hh, cz - hd], [cx - hw, cy + hh, cz - hd],
        [cx - hw, cy - hh, cz + hd], [cx + hw, cy - hh, cz + hd],
        [cx + hw, cy + hh, cz + hd], [cx - hw, cy + hh, cz + hd],
    ], dtype=np.float32)
    indices = np.array([
        0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6,
        0, 4, 5, 0, 5, 1, 2, 6, 7, 2, 7, 3,
        0, 3, 7, 0, 7, 4, 1, 5, 6, 1, 6, 2,
    ], dtype=np.uint16)
    return verts, indices


def add_emissive_material(gltf, name, color, strength=3.0):
    mat_idx = len(gltf['materials'])
    gltf['materials'].append({
        'name': name,
        'pbrMetallicRoughness': {'baseColorFactor': [*color, 1.0], 'metallicFactor': 0.1, 'roughnessFactor': 0.2},
        'emissiveFactor': list(color),
        'extensions': {'KHR_materials_emissive_strength': {'emissiveStrength': strength}},
    })
    if 'extensionsUsed' not in gltf:
        gltf['extensionsUsed'] = []
    if 'KHR_materials_emissive_strength' not in gltf['extensionsUsed']:
        gltf['extensionsUsed'].append('KHR_materials_emissive_strength')
    return mat_idx


def add_lamp_mesh(gltf, bin_data, name, center, size, mat_idx):
    verts, indices = make_box(center, size)
    pos_acc = append_buffer(gltf, bin_data, verts)
    idx_acc = append_buffer(gltf, bin_data, indices)
    mesh_idx = len(gltf['meshes'])
    gltf['meshes'].append({'name': name, 'primitives': [{'attributes': {'POSITION': pos_acc}, 'indices': idx_acc, 'material': mat_idx}]})
    node_idx = len(gltf['nodes'])
    gltf['nodes'].append({'name': name, 'mesh': mesh_idx})
    return node_idx


def analyze_body(gltf, bin_data):
    body_idx = next(i for i, n in enumerate(gltf['nodes']) if n.get('name') == 'Body_FixedFenders')
    pos = read_positions(gltf, bin_data, gltf['nodes'][body_idx]['mesh'])
    rear_z = pos[:, 2].max()
    front_z = pos[:, 2].min()
    rear = pos[pos[:, 2] > rear_z - 0.12]
    front = pos[pos[:, 2] < front_z + 0.12]
    return {
        'rear_z': float(rear_z), 'front_z': float(front_z),
        'rear_x': (float(rear[:, 0].min()), float(rear[:, 0].max())),
        'rear_y': float(np.percentile(rear[:, 1], 65)),
        'front_x': (float(front[:, 0].min()), float(front[:, 0].max())),
        'front_y': float(np.percentile(front[:, 1], 55)),
    }


def main():
    gltf, bin_data = read_glb(IN_PATH)
    if gltf['buffers'][0].get('byteLength', 0) != len(bin_data):
        gltf['buffers'][0]['byteLength'] = len(bin_data)
    names = {n.get('name') for n in gltf['nodes']}
    if 'Tail_light_bar' in names:
        print('ALREADY_HAS_LAMPS', IN_PATH)
        return
    geom = analyze_body(gltf, bin_data)
    rear_w = geom['rear_x'][1] - geom['rear_x'][0]
    front_w = geom['front_x'][1] - geom['front_x'][0]
    rear_mat = add_emissive_material(gltf, 'Lamps', (0.7, 0.006, 0.003))
    front_mat = add_emissive_material(gltf, 'Lamps', (0.85, 0.93, 1.0))
    tail_idx = add_lamp_mesh(gltf, bin_data, 'Tail_light_bar', center=(0, geom['rear_y'], geom['rear_z'] - 0.006), size=(rear_w * 0.92, 0.014, 0.012), mat_idx=rear_mat)
    front_idx = add_lamp_mesh(gltf, bin_data, 'Front_light_bar', center=(0, geom['front_y'], geom['front_z'] + 0.006), size=(front_w * 0.88, 0.012, 0.010), mat_idx=front_mat)
    gltf['scenes'][0]['nodes'].extend([tail_idx, front_idx])
    gltf['buffers'][0]['byteLength'] = len(bin_data)
    write_glb(OUT_PATH, gltf, bin_data)
    audit = {'status': 'LAMPS_ADDED', 'input': str(IN_PATH), 'output': str(OUT_PATH), 'geometry': geom, 'nodes_added': ['Tail_light_bar', 'Front_light_bar'], 'materials': 'Lamps (red rear, white front, emissive)', 'method': 'Body_FixedFenders bounds; thin strip meshes, not runtime proxy'}
    (OUT_PATH.parent / 'cybercab-lamps-repair-audit.json').write_text(json.dumps(audit, indent=2))
    print('LAMPS_REPAIR', json.dumps(audit))

if __name__ == '__main__':
    main()
