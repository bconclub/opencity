"""CPU evidence for source52057928 junction: original meshes vs final ground."""
import json, math, sys, xml.etree.ElementTree as ET
from pathlib import Path
sys.path.insert(0, 'D:/CodexTools/python-libs')
from shapely.geometry import Point, Polygon, LineString, box, shape
from shapely.ops import unary_union, transform
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
origin = [77.59136, 12.97984615]
probe = [77.59020226666667, 12.975491600004656]
factor = 2 * math.pi * 6371008.8 / 40075016.686
circ = 2 * math.pi * 6371008.8 * math.cos(math.radians(origin[1]))
merc_y = lambda lat: math.asinh(math.tan(math.radians(lat))) / (2 * math.pi)
def projected(lon, lat, z=None):
    return ((lon - origin[0]) * circ / 360, (merc_y(lat) - merc_y(origin[1])) * circ)
qx, qy = projected(*probe)
def relative(lon, lat, z=None):
    x, y = projected(lon, lat)
    return x - qx, y - qy
window = box(-22, -22, 22, 22)
raw = json.loads((ROOT / 'experiments/osm2world/coverage-500/meshes.json').read_text())
triangles = []
for mesh_id, mesh in enumerate(raw):
    ps, ids = mesh['positions'], mesh['indices']
    for i in range(0, len(ids), 3):
        points = [(ps[n * 3] * factor - qx, ps[n * 3 + 2] * factor - qy) for n in ids[i:i + 3]]
        poly = Polygon(points)
        if poly.area < 1e-8 or not poly.intersects(window): continue
        triangles.append((mesh_id, i // 3, poly, tuple(round(c * 255) for c in mesh['color'][:3])))
raw_ground = unary_union([p for _, _, p, _ in triangles])
final_doc = json.loads((ROOT / 'experiments/osm2world/coverage-500-classified/asset/vidhana-footprint.geojson').read_text())
final = [transform(relative, shape(f['geometry'])) for f in final_doc['features']]
final = [p for p in final if p.intersects(window)]
final_ground = unary_union(final)
root = ET.parse(ROOT / 'vidhana-streets.osm').getroot()
nodes = {n.get('id'): (float(n.get('lon')), float(n.get('lat'))) for n in root.findall('node')}
ways, selected = {}, []
for w in root.findall('way'):
    refs = [n.get('ref') for n in w.findall('nd')]
    tags = {t.get('k'): t.get('v') for t in w.findall('tag')}
    ways[w.get('id')] = {'refs': refs, 'tags': tags}
    pts = [relative(*nodes[n]) for n in refs if n in nodes]
    if len(pts) < 2: continue
    line = LineString(pts)
    if line.distance(Point(0, 0)) < 16:
        selected.append({'id': w.get('id'), 'tags': tags, 'line': line,
                         'distanceM': line.distance(Point(0, 0)), 'closed': refs[0] == refs[-1],
                         'containsProbe': bool(refs[0] == refs[-1] and Polygon(pts).covers(Point(0, 0)))})
route = LineString([relative(*nodes[n]) for n in ways['52057928']['refs'][:2]])
uncovered = route.difference(raw_ground)
evidence = {'probe': probe, 'rawConverterGroundGapM': Point(0, 0).distance(raw_ground),
            'finalGroundGapM': Point(0, 0).distance(final_ground),
            'rawVsFinalCoverageDifferenceWithin44mSquareM2': raw_ground.symmetric_difference(final_ground).intersection(window).area,
            'uncoveredOriginalFirstSegmentM': uncovered.length,
            'nearbyWays': [{k: v for k, v in w.items() if k != 'line'} for w in selected],
            'nearestSourceTriangles': [{'sourceMeshIndex': mi, 'triangle': ti, 'gapM': p.distance(Point(0, 0)), 'color': col}
                                       for mi, ti, p, col in sorted(triangles, key=lambda t: t[2].distance(Point(0, 0)))[:8]]}
evidence['rawVsFinalDifferenceWithin10mOfProbeM2'] = raw_ground.symmetric_difference(final_ground).intersection(Point(0, 0).buffer(10)).area
clearance_tests = []
a, b = list(route.coords)
for radius in (0, .1, .25, .5, 1):
    inset = raw_ground.buffer(-radius)
    parts = list(inset.geoms) if hasattr(inset, 'geoms') else [inset]
    clearance_tests.append({'vehicleHalfWidthM': radius,
        'startCovered': inset.covers(Point(a)), 'endCovered': inset.covers(Point(b)),
        'sameConnectedSurface': any(p.covers(Point(a)) and p.covers(Point(b)) for p in parts)})
evidence['clearanceTests'] = clearance_tests
evidence['interpretation'] = 'Not introduced by clipping or cleanup. Raw converter leaves a narrow/degenerate acute-angle junction join; no mapped garden island covers this sample. Real-world island/kerb layout remains unverified.'
(ROOT / 'qc/street-500-route-junction.json').write_text(json.dumps(evidence, indent=2) + '\n')

W, H, S = 1520, 900, 14
image = Image.new('RGB', (W, H), '#f2f5f6'); draw = ImageDraw.Draw(image)
font_path = 'C:/Windows/Fonts/arial.ttf'
font = ImageFont.truetype(font_path, 17); small = ImageFont.truetype(font_path, 14); title = ImageFont.truetype(font_path, 26)
draw.text((28, 18), '52057928 junction: missing ground already exists in raw converter', fill='#132b3a', font=title)
draw.text((28, 58), 'CPU plan view, metres. Red cross: failed route sample. Red: service route. Cyan: circular road. Orange: footways.', fill='#243c4c', font=font)
def pixels(point, cx): return cx + point[0] * S, 425 - point[1] * S
def polygons(geom):
    if geom.geom_type == 'Polygon': return [geom]
    return [g for g in getattr(geom, 'geoms', []) if g.geom_type == 'Polygon']
for panel, cx in enumerate((375, 1135)):
    draw.rectangle((cx - 22 * S, 425 - 22 * S, cx + 22 * S, 425 + 22 * S), fill='#dedcce', outline='#9aaeb6')
    draw.text((cx - 300, 88), 'RAW OSM2WORLD TRIANGLES' if not panel else 'FINAL CLASSIFIED FOOTPRINT', fill='#17364a', font=font)
    shapes = [(p, col) for _, _, p, col in triangles] if not panel else [(p, (126, 137, 144)) for p in final]
    for p, col in shapes:
        for geom in polygons(p.intersection(window)):
            draw.polygon([pixels(v, cx) for v in geom.exterior.coords], fill=col, outline=tuple(max(0, c - 24) for c in col))
    for way in selected:
        h = way['tags'].get('highway')
        if not h and way['id'] != '1317160300': continue
        line = way['line'].intersection(window)
        parts = [line] if line.geom_type == 'LineString' else [p for p in getattr(line, 'geoms', []) if p.geom_type == 'LineString']
        color = '#ff5252' if way['id'] == '52057928' else '#00d9ff' if way['id'] == '1091198031' else '#ffc43b' if h else '#a35aff'
        for part in parts: draw.line([pixels(v, cx) for v in part.coords], fill=color, width=3)
    for ref, label in [('428831252', 'shared road node'), ('663564863', 'footway junction')]:
        x, y = pixels(relative(*nodes[ref]), cx)
        draw.ellipse((x - 4, y - 4, x + 4, y + 4), fill='#ffffff', outline='#1e3242')
        draw.text((x + 7, y - 16), label, fill='#101b25', font=small, stroke_width=1, stroke_fill='#eeeeee')
    x, y = pixels((0, 0), cx)
    draw.line((x - 8, y, x + 8, y), fill='#ff0000', width=3); draw.line((x, y - 8, x, y + 8), fill='#ff0000', width=3)
    draw.ellipse((x - 13, y - 13, x + 13, y + 13), outline='#ff0000', width=2)
    draw.text((cx - 300, 748), f"Gap: {evidence['rawConverterGroundGapM' if not panel else 'finalGroundGapM']:.3f} m", fill='#17364a', font=font)
    draw.line((cx + 180, 770, cx + 180 + 5 * S, 770), fill='#163445', width=3)
    draw.text((cx + 180, 780), '5 metres', fill='#17364a', font=small)
draw.text((28, 828), 'Purple outline: mapped junction area 1317160300. No mapped island geometry covers the failed sample.', fill='#17364a', font=font)
draw.text((28, 858), 'Geometry evidence only. No street photograph or imagery verification, and no repair applied.', fill='#17364a', font=font)
image.save(ROOT / 'qc/street-500-route-junction.png')
print(json.dumps({k: v for k, v in evidence.items() if k not in ('nearbyWays', 'nearestSourceTriangles')}, indent=2))
