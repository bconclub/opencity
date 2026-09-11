"""CPU-only source routing audit. Never runs the production generator main()."""
import collections
import hashlib
import importlib.util
import json
import math
import os
from pathlib import Path
import sys
import tempfile
import contextlib
import io
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, 'D:/CodexTools/python-libs')
from shapely.geometry import Point, shape
from shapely.ops import transform, unary_union

production = [ROOT / name for name in ('vidhana-road-network.json', 'vidhana-street-data.json')]
hashes = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in production}
spec = importlib.util.spec_from_file_location('streets', ROOT / 'prepare-vidhana-streets.py')
streets = importlib.util.module_from_spec(spec)
spec.loader.exec_module(streets)

# These test behavior, not rendering: restricted surfaces must remain visible,
# while the motor network cannot inherit foot traffic permissions.
cases = [
    ({'highway': 'service'}, True),
    ({'highway': 'steps', 'motor_vehicle': 'yes'}, False),
    ({'highway': 'footway'}, False),
    ({'highway': 'cycleway'}, False),
    ({'highway': 'pedestrian'}, False),
    ({'highway': 'service', 'access': 'private'}, False),
    ({'highway': 'service', 'access': 'no', 'foot': 'yes'}, False),
    ({'highway': 'service', 'access': 'private', 'motor_vehicle': 'yes'}, True),
    ({'highway': 'service', 'motor_vehicle': 'no', 'access': 'yes'}, False),
    ({'highway': 'service', 'vehicle': 'delivery'}, False),
    ({'highway': 'service', 'access': 'destination'}, False),
    ({'highway': 'service', 'access': 'permissive'}, True),
    ({'highway': 'service', 'tunnel': 'building_passage'}, False),
    ({'highway': 'service', 'bridge': 'viaduct'}, False),
    ({'highway': 'service', 'brunnel': 'bridge'}, False),
    ({'highway': 'service', 'brunnel': 'tunnel'}, False),
    ({'highway': 'service', 'bridge': 'no', 'tunnel': 'no', 'layer': '0'}, True),
    ({'highway': 'service', 'layer': '-1'}, False),
    ({'highway': 'service', 'layer': '1'}, False),
    ({'highway': 'service', 'layer': 'unknown'}, False),
    ({'highway': 'service', 'oneway': 'reversible'}, False),
    ({'highway': 'service', 'motor_vehicle:conditional': 'yes @ (Mo-Sa 08:00-21:00)'}, False),
]
for tags, expected in cases:
    assert streets.motor_route_eligibility(tags)[0] == expected, tags
assert streets.surface_eligibility({'highway': 'service', 'access': 'private'})[0]
assert streets.surface_eligibility({'highway': 'footway', 'access': 'private'})[0]
for tags, expected in [({'oneway': '-1'}, '-1'), ({'oneway': 'yes'}, 'yes'),
                       ({'oneway': '0'}, 'no'), ({'junction': 'roundabout'}, 'yes'),
                       ({'junction': 'circular'}, 'no'),
                       ({'junction': 'roundabout', 'oneway': 'no'}, 'no')]:
    assert streets.normalise_oneway(tags) == expected
assert [(i, a, b) for i, a, b, *_ in streets.source_segments(
    ['a', 'b', 'missing', 'd', 'e'], {key: (0, 0) for key in 'abde'})] == [(0, 'a', 'b'), (3, 'd', 'e')]
clipped = streets.clip((-600, 0), (600, 0))
assert clipped == ((-488.0, 0.0), (488.0, 0.0))  # Both endpoints outside, segment crosses circle.
metadata = streets.route_metadata({'oneway': '-1'}, 'w', 3, 'a', 'b', (-600, 0), (600, 0), *clipped)
assert metadata['sourceNodes'] == ['a', 'b'] and metadata['oneway'] == '-1'
assert all(0 < f < 1 for f in metadata['sourceFractions'])

# Exercise the generator in an isolated directory. Access changes remove only
# motor routes, not private visible roads/footpaths, and missing refs do not join.
fixture = '''<osm version="0.6">
<node id="a" lon="77.5908" lat="12.9798"/><node id="b" lon="77.5910" lat="12.9798"/>
<node id="c" lon="77.5912" lat="12.9798"/><node id="d" lon="77.5914" lat="12.9798"/>
<node id="e" lon="77.5908" lat="12.9801"/><node id="f" lon="77.5910" lat="12.9801"/>
<node id="g" lon="77.5908" lat="12.9803"/><node id="h" lon="77.5910" lat="12.9803"/>
<way id="public"><nd ref="a"/><nd ref="b"/><nd ref="missing"/><nd ref="c"/><nd ref="d"/>
<tag k="highway" v="service"/><tag k="oneway" v="-1"/></way>
<way id="private"><nd ref="e"/><nd ref="f"/><tag k="highway" v="service"/><tag k="access" v="private"/></way>
<way id="path"><nd ref="g"/><nd ref="h"/><tag k="highway" v="footway"/><tag k="access" v="private"/></way>
</osm>'''
old_cwd = Path.cwd()
with tempfile.TemporaryDirectory(prefix='opencity-route-test-') as sandbox:
    try:
        os.chdir(sandbox)
        Path('vidhana-streets.osm').write_text(fixture)
        with contextlib.redirect_stdout(io.StringIO()): streets.main()
        generated = json.loads(Path('vidhana-road-network.json').read_text())['features']
        surfaces = json.loads(Path('vidhana-street-data.json').read_text())['features']
        assert len(generated) == 2
        assert [f['properties']['sourceNodes'] for f in generated] == [['a', 'b'], ['c', 'd']]
        assert all(f['properties']['oneway'] == '-1' for f in generated)
        assert any(f['properties']['osm'] == 'way/private' and f['properties']['kind'] == 'road' for f in surfaces)
        assert any(f['properties']['osm'] == 'way/path' and f['properties']['kind'] == 'footpath' for f in surfaces)
    finally:
        os.chdir(old_cwd)

root = ET.parse(ROOT / 'vidhana-streets.osm').getroot()
nodes = {n.get('id'): (float(n.get('lon')), float(n.get('lat'))) for n in root.findall('node')}
ways = {w.get('id'): w for w in root.findall('way')}
input_data = json.loads((ROOT / 'experiments/osm2world/coverage-500/input.json').read_text(encoding='utf-8'))
input_ways = {e['id']: e for e in input_data['elements'] if e['type'] == 'way'}
provenance = json.loads((ROOT / 'experiments/osm2world/coverage-500/provenance.json').read_text(encoding='utf-8'))
for entry in provenance:
    source_refs = [int(n.get('ref')) for n in ways[str(entry['sourceWay'])].findall('nd')]
    assert input_ways[entry['id']]['nodes'] == source_refs[entry['firstNodeIndex']:entry['lastNodeIndex'] + 1]

audit = json.loads((ROOT / 'qc/street-500-integration-audit.json').read_text(encoding='utf-8'))
origin = audit['candidate']['origin']
mx = 111320 * math.cos(math.radians(origin[1]))
merc_y = math.asinh(math.tan(math.radians(origin[1])))
# Verified source: MetricMapProjection.java / MercatorProjection.java. Native
# OSM2World metres use WGS84 equatorial circumference, MapLibre uses mean radius.
factor = 2 * math.pi * 6371008.8 / 40075016.686
def local(lon, lat, z=None):
    return ((lon - origin[0]) * mx, (lat - origin[1]) * 111320)
def reproject(lon, lat, z=None):
    lon = origin[0] + (lon - origin[0]) * factor
    lat = math.degrees(math.atan(math.sinh(merc_y + (math.asinh(math.tan(math.radians(lat))) - merc_y) * factor)))
    return local(lon, lat)
footprint = json.loads((ROOT / 'experiments/osm2world/coverage-500/clipped-asset/vidhana-footprint.geojson').read_text(encoding='utf-8'))
ground = unary_union([transform(local, shape(f['geometry'])) for f in footprint['features']])
corrected = unary_union([transform(reproject, shape(f['geometry'])) for f in footprint['features']])
misses = []
for example in audit['routes']['missingExamples']:
    way_id = example['osm'].split('/')[-1]
    way = ways[way_id]
    tags = streets.tags(way)
    refs = [n.get('ref') for n in way.findall('nd')]
    point = Point(*local(*example['point']))
    nearest = min((point.distance(Point(*local(*nodes[n]))), i, n) for i, n in enumerate(refs) if n in nodes)
    terminal = nearest[0] < .001 and nearest[1] in (0, len(refs) - 1)
    remaining = point.distance(corrected)
    misses.append({**example, 'sourceTags': tags, 'motorEligibility': streets.motor_route_eligibility(tags),
                   'nearestSourceNode': nearest[2], 'distanceToSourceNodeM': nearest[0],
                   'isTerminalNode': terminal, 'measuredFootprintGapM': point.distance(ground),
                   'gapAfterProjectionCorrectionM': remaining,
                   'cause': 'native-to-MapLibre scale mismatch; remainder within native millimetre snapping' if remaining < .001
                            else 'real junction ground omission remains after projection correction'})
assert sum(m['isTerminalNode'] for m in misses) == 19
assert sum(m['gapAfterProjectionCorrectionM'] < .001 for m in misses) == 19

# Preview only. Source identity and interpolation are recorded before clipping;
# topology cannot silently bridge missing refs, nearby unrelated roads or private ways.
preview = []
portals = []
excluded = collections.Counter()
for way_id, way in ways.items():
    tags = streets.tags(way)
    allowed, reason = streets.motor_route_eligibility(tags)
    refs = [n.get('ref') for n in way.findall('nd')]
    for index, start_ref, end_ref, pa, pb in streets.source_segments(refs, nodes):
        a, b = streets.local(pa), streets.local(pb)
        segment = streets.clip(a, b)
        if not segment: continue
        if not allowed:
            if tags.get('highway') in streets.MOTOR_HIGHWAYS: excluded[reason] += 1
            continue
        metadata = streets.route_metadata(tags, way_id, index, start_ref, end_ref, a, b, *segment)
        for q, fraction in zip(segment, metadata['sourceFractions']):
            if 1e-9 < fraction < 1 - 1e-9:
                portals.append({'sourceWay': way_id, 'sourceSegment': index, 'sourceNodes': [start_ref, end_ref],
                                'fraction': fraction, 'point': streets.geo(q), 'oneway': metadata['oneway'],
                                'sourceEndpoints': [pa, pb], 'radiusM': math.hypot(*q)})
        assert refs[index:index + 2] == metadata['sourceNodes']
        assert all(-1e-9 <= f <= 1 + 1e-9 for f in metadata['sourceFractions'])
        preview.append({'type': 'Feature', 'properties': metadata,
                        'geometry': {'type': 'LineString', 'coordinates': [streets.geo(q) for q in segment]}})
results = {'projectionCorrectionXY': factor, 'unchangedHeight': True, 'missingSamples': misses,
           'eligibleSourceSegments488m': len(preview), 'excludedMotorSegments': dict(excluded),
           'boundaryPortals488m': portals, 'verifiedConverterSourceContiguousPieces': len(provenance),
           'tests': {'eligibilityCases': len(cases), 'onewayCases': 6, 'missingNodeGap': 'pass',
                     'outsideEndpointsCrossing': 'pass', 'sourceIdentityAfterClipping': 'pass',
                     'isolatedGeneratorVisibleRestrictedSurfaces': 'pass'},
           'productionSha256': hashes, 'productionRegenerated': False, 'gpuUsed': False}
# Keep residual omissions visible. Eligibility and scale correction cannot
# justify a blanket closest-point snap at a junction or an unverified seam.
residuals = []
sample_count = 0
for feature in preview:
    a, b = [local(*p) for p in feature['geometry']['coordinates']]
    steps = max(1, math.ceil(math.dist(a, b) / 5))
    for index in range(steps + 1):
        t = index / steps
        point = Point(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
        sample_count += 1
        gap = point.distance(corrected)
        if gap > .001:
            residuals.append({'sourceWay': feature['properties']['sourceWay'],
                              'sourceSegment': feature['properties']['sourceSegment'],
                              'distanceM': gap, 'fractionWithinClippedSegment': t})
results['eligibleRouteSamples5m'] = sample_count
results['eligibleRouteResidualMissesOver1mm'] = residuals
# Source-node identity graph for the handoff proposal. No 1.5 m spatial
# rounding is used, and directed traversal follows the retained OSM oneway.
adjacency = collections.defaultdict(set)
def endpoint_key(properties, end):
    fraction = properties['sourceFractions'][end]
    if abs(fraction) < 1e-9: return 'node/' + properties['sourceNodes'][0]
    if abs(fraction - 1) < 1e-9: return 'node/' + properties['sourceNodes'][1]
    return 'portal/' + properties['sourceWay'] + '/' + str(properties['sourceSegment']) + '/' + f'{fraction:.12f}'
for feature in preview:
    p = feature['properties']
    a, b = endpoint_key(p, 0), endpoint_key(p, 1)
    adjacency[a]; adjacency[b]
    if p['oneway'] != '-1': adjacency[a].add(b)
    if p['oneway'] != 'yes': adjacency[b].add(a)
results['sourceGraph'] = {'nodes': len(adjacency), 'directedEdges': sum(map(len, adjacency.values())),
                         'deadEndNodes': sum(not destinations for destinations in adjacency.values()),
                         'boundaryPolicy': 'same source pair/fraction only; never radius-snap unrelated district vectors'}
final_dir = ROOT / 'experiments/osm2world/coverage-500-classified/asset'
if (final_dir / 'vidhana-footprint.geojson').exists():
    final_doc = json.loads((final_dir / 'vidhana-footprint.geojson').read_text(encoding='utf-8'))
    final_ground = unary_union([transform(local, shape(f['geometry'])) for f in final_doc['features']])
    final_misses = []
    for feature in preview:
        a, b = [local(*p) for p in feature['geometry']['coordinates']]
        steps = max(1, math.ceil(math.dist(a, b) / 5))
        for i in range(steps + 1):
            point = Point(a[0] + (b[0] - a[0]) * i / steps, a[1] + (b[1] - a[1]) * i / steps)
            gap = point.distance(final_ground)
            if gap > .001:
                final_misses.append({'sourceWay': feature['properties']['sourceWay'],
                                     'sourceSegment': feature['properties']['sourceSegment'],
                                     'distanceM': gap, 'fractionWithinClippedSegment': i / steps})
    results['finalClassifiedGround'] = {'path': str(final_dir.relative_to(ROOT)),
        'footprintSha256': hashlib.sha256((final_dir / 'vidhana-footprint.geojson').read_bytes()).hexdigest(),
        'samples': sample_count, 'missesOver1mm': final_misses,
        'explicitBlocker': 'way/52057928 source segment0 junction ground omission'}
    assert len(final_misses) == 1 and final_misses[0]['sourceWay'] == '52057928'
for p in production:
    assert hashlib.sha256(p.read_bytes()).hexdigest() == hashes[p.name], 'Production data changed unexpectedly'
(ROOT / 'qc/street-500-route-audit.json').write_text(json.dumps(results, indent=2) + '\n')
(ROOT / 'qc/street-500-route-preview.geojson').write_text(json.dumps({'type': 'FeatureCollection', 'features': preview}, separators=(',', ':')))
print(json.dumps({k: v for k, v in results.items() if k not in ('missingSamples', 'boundaryPortals488m', 'productionSha256')}, indent=2))
print('Boundary portals:', len(portals))
