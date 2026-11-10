"""Validate every shipped asset against the generated manifest.
Optional original archive path verifies byte-for-byte provenance as well.
Requires Pillow only for decoding images: python -m pip install Pillow.
"""
import hashlib, json, sys, zipfile
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
m=json.loads((root/'ASSET-MANIFEST.json').read_text())
z=zipfile.ZipFile(sys.argv[1]) if len(sys.argv)>1 else None
registry=json.loads((root/'data/characters.json').read_text())
assert set(registry)=={f'G-{i:03}' for i in range(1,11)}
for row in m['assets']:
 p=root/row['path']; b=p.read_bytes()
 assert hashlib.sha256(b).hexdigest()==row['sha256'],p
 if z: assert z.read(row['source'])==b,p
 if p.suffix=='.webp':
  with Image.open(p) as im:
   im.load(); assert list(im.size)==row['dimensions'],p
 else:
  d=json.loads(b); assert d['characterId']==p.parent.name and d['schemaVersion']=='1.0.0'
assert len(m['assets'])==60
print('PASS: 50 images decoded, 10 crop JSON validated, all SHA-256 hashes match'+('; ZIP bytes identical' if z else ''))
