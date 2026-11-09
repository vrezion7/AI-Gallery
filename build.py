"""Build a portable static folder; no external dependencies."""
from pathlib import Path
import shutil
root=Path(__file__).resolve().parent
out=root/'dist'
if out.exists(): shutil.rmtree(out)
out.mkdir()
for name in ['index.html','src','data','assets']:
 p=root/name
 if p.is_dir(): shutil.copytree(p,out/name)
 else: shutil.copy2(p,out/name)
print('Built',out)
