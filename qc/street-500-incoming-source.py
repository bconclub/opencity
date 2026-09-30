"""Recover one missing mapped approach. CPU-only, isolated OSM conversion input."""
import json, hashlib, math, xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'qc/street-500-incoming-junction'
OUT.mkdir(exist_ok=True)
SOURCE = ROOT / 'vidhana-streets.osm'
REMOTE = ROOT / 'qc/street-500-combined/incoming-source-full.osm'
CONNECTED = ROOT / 'qc/street-500-combined/incoming-source-ways.osm'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
tree = ET.parse(SOURCE)
osm = tree.getroot()
fresh = ET.parse(REMOTE).getroot()
nodes = {n.get('id'): n for n in osm.findall('node')}
ways = {w.get('id'): w for w in osm.findall('way')}
way = fresh.find('way')
assert way.get('id') == '1091198032' and way.get('version') == '10'
assert '1091198032' not in ways, 'Missing-way repair already exists in input'
tags = {t.get('k'): t.get('v') for t in way.findall('tag')}
assert tags['surface'] == 'asphalt' and tags['oneway'] == 'yes'
assert tags['motor_vehicle:conditional'] == 'yes @ (Mo-Sa 08:00-21:00)'
added = []
unchanged = []
for n in fresh.findall('node'):
    previous = nodes.get(n.get('id'))
    if previous is not None:
        assert all(float(previous.get(k)) == float(n.get(k)) for k in ('lon', 'lat')), 'Shared node changed coordinates'
        unchanged.append(n.get('id'))
    else:
        osm.append(n)
        nodes[n.get('id')] = n
        added.append(n.get('id'))
osm.append(way)
target = OUT / 'source.osm'
tree.write(target, encoding='utf-8', xml_declaration=True)

def tags_of(e):
    return {t.get('k'): t.get('v') for t in e.findall('tag')}

elements = [dict(type='node', id=int(n.get('id')), lon=float(n.get('lon')), lat=float(n.get('lat')), tags=tags_of(n)) for n in osm.findall('node')]
elements += [dict(type='way', id=int(w.get('id')), nodes=[int(n.get('ref')) for n in w.findall('nd')], tags=tags_of(w)) for w in osm.findall('way')]
(OUT / 'elements.json').write_text(json.dumps(elements, separators=(',', ':')))
connected = [w.get('id') for w in osm.findall('way') if any(n.get('ref') == '428831252' for n in w.findall('nd'))]
assert sorted(connected) == sorted(['1091198032', '1091198031', '52057928'])
radius = lambda n: math.hypot((float(n.get('lon'))-77.5908)*math.pi/180*6371008.8*math.cos(math.radians(12.9798)), (float(n.get('lat'))-12.9798)*math.pi/180*6371008.8)
coords = [dict(id=n.get('ref'), lon=float(nodes[n.get('ref')].get('lon')), lat=float(nodes[n.get('ref')].get('lat')), radiusM=radius(nodes[n.get('ref')])) for n in way.findall('nd')]
report = dict(sourceSHA256=sha(SOURCE), remoteSourceSHA256=sha(REMOTE), connectedWaysResponseSHA256=sha(CONNECTED), outputSHA256=sha(target),
    apiURL='https://api.openstreetmap.org/api/0.6/way/1091198032/full', nodeWaysURL='https://api.openstreetmap.org/api/0.6/node/428831252/ways',
    sourceVersion=way.get('version'), sourceTimestamp=way.get('timestamp'), addedWay='1091198032', addedNodes=added,
    sharedNodesUnchanged=unchanged, junctionNode='428831252', incidentWays=connected, tags=tags, coordinates=coords,
    diagnoses=['Missing incoming road in local OSM snapshot caused two-approach acute converter cap.', 'Malformed native cap radius486–490m lies inside500m clip; it is not the circle clipping seam.'],
    estimatedWidth='Do not add a guessed width tag; regenerate original converter from mapped two lanes and sidewalk tags. Resulting widths remain estimates.',
    routesChanged=False, conditionalMotorAccessEnabled=False, runtimePromoted=False)
(OUT / 'source-audit.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps({k: report[k] for k in ('addedWay', 'addedNodes', 'sharedNodesUnchanged', 'incidentWays', 'routesChanged')}))
