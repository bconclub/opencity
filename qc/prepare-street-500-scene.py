"""Build preview surfaces against candidate footprint; never overwrite runtime data."""
import hashlib,json,shutil,subprocess,sys,tempfile
from pathlib import Path

root=Path(__file__).resolve().parents[1]
target=root/'qc/street-500-scene-data'
candidate=root/'experiments/osm2world/coverage-500-classified/asset'
names=('vidhana-street-data.json','vidhana-road-network.json')
hashes={name:hashlib.sha256((root/name).read_bytes()).hexdigest() for name in names}
with tempfile.TemporaryDirectory(prefix='opencity-street-scene-') as temporary:
    work=Path(temporary)
    shutil.copy2(root/'vidhana-streets.osm',work/'vidhana-streets.osm')
    (work/'assets/streets').mkdir(parents=True)
    shutil.copy2(candidate/'vidhana-footprint.geojson',work/'assets/streets/vidhana-footprint.geojson')
    subprocess.run([sys.executable,str(root/'prepare-vidhana-streets.py')],cwd=work,check=True)
    target.mkdir(parents=True,exist_ok=True)
    for name in names:shutil.copy2(work/name,target/name)
assert all(hashlib.sha256((root/name).read_bytes()).hexdigest()==digest for name,digest in hashes.items())
surface=json.loads((target/names[0]).read_text())
report={'productionUnchanged':True,'productionSHA256':hashes,'candidateFootprintSHA256':hashlib.sha256((candidate/'vidhana-footprint.geojson').read_bytes()).hexdigest(),
        'zebraLocations':surface['counts']['zebraCrossings'],'zebraPolygons':sum(f['properties']['kind']=='zebra' for f in surface['features']),
        'note':'Browser preview intercepts surfaces only. New motor graph is isolated pending junction and boundary checks.'}
(target/'provenance.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
