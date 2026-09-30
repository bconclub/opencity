from pathlib import Path
import shutil
p=Path('/opt/opencity-rooms/server.mjs')
old="['auto','helicopter','supercar','yulu','bike','delivery','cycle','spectator'].includes(pose.vehicle)"
new="['cybertruck','cybercab','kitt','auto','helicopter','supercar','yulu','bike','delivery','cycle','spectator'].includes(pose.vehicle)"
text=p.read_text()
if new in text:
    print('Vehicle IDs already installed')
else:
    assert text.count(old)==1, 'Unexpected live allowlist; refuse modification'
    backup=p.with_name('server.mjs.before-vehicle-ids-20260910')
    assert not backup.exists(), 'Existing backup; inspect before retry'
    shutil.copy2(p,backup)
    p.write_text(text.replace(old,new))
    print('Added only cybertruck, cybercab and kitt; backup saved')
