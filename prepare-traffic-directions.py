"""Restore mapped direction tags without rebuilding any street geometry."""
import json
from pathlib import Path
import xml.etree.ElementTree as ET
ways={}
for way in ET.parse('vidhana-streets.osm').getroot().findall('way'):
    tags={t.get('k'):t.get('v') for t in way.findall('tag')}
    ways['way/'+way.get('id')]=tags.get('oneway','yes' if tags.get('junction')=='roundabout' else 'no')
path=Path('vidhana-road-network.json')
data=json.loads(path.read_text(encoding='utf-8'))
for feature in data['features']:
    props=feature['properties']
    props['oneway']=ways.get(props.get('osm'),'no')
path.write_text(json.dumps(data,separators=(',',':')),encoding='utf-8')
print({'onewaySegments':sum(f['properties']['oneway'] not in ('no','0','false') for f in data['features'])})
