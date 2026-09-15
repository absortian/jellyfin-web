#!/usr/bin/env python3
"""Package an already-built, matching 10.11.6 worktree for NAS1."""
import argparse
import datetime
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tarfile
import tempfile

project = Path(__file__).resolve().parents[2]
source = project.parent / 'jellyfin-web-10.11.6'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--dist-dir', type=Path, help='Build output directory; defaults to the 10.11.6 worktree dist.')
args = parser.parse_args()
dist = args.dist_dir.resolve() if args.dist_dir else source / 'dist'
assert json.loads((source / 'package.json').read_text())['version'] == '10.11.6'
for required in ['index.html', 'themes/absorflix/theme.css', 'assets/audio/absorflix/intro.mp3']:
    assert (dist / required).is_file(), f'Missing build output: {required}'

patch = subprocess.check_output(['git', 'diff', 'HEAD', '--binary'], cwd=source)
untracked = subprocess.check_output(['git', 'ls-files', '--others', '--exclude-standard', '-z'], cwd=source)
for name in untracked.decode().split('\0'):
    if name.startswith('src/'):
        result = subprocess.run(['git', 'diff', '--no-index', '--binary', '/dev/null', name], cwd=source, capture_output=True)
        assert result.returncode in (0, 1), result.stderr.decode()
        patch += result.stdout

digest = hashlib.sha256(patch).hexdigest()
build_id = f'{datetime.date.today():%Y%m%d}-{digest[:8]}'
release_id = f'10.11.6-absorflix-{build_id}'
artifact = project / 'deployment/artifacts' / f'absorflix-web-10.11.6-{build_id}.tar.gz'
artifact.parent.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory(prefix='absorflix-package-') as temp:
    staging = Path(temp)
    shutil.copytree(dist, staging / 'web')
    for name in ['deploy.sh', 'rollback.sh', 'README.md']:
        shutil.copy2(Path(__file__).parent / name, staging / name)
    (staging / 'RELEASE').write_text(release_id + '\n')
    (staging / 'absorflix-source.patch').write_bytes(patch)
    shutil.copy2(source / 'LICENSE', staging / 'LICENSE')
    metadata = {
        'release': release_id,
        'serverVersion': '10.11.6',
        'upstreamCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=source, text=True).strip(),
        'sourcePatchSha256': digest,
        'androidNativeIntro': 'before-webview-handoff'
    }
    (staging / 'web/absorflix-release.json').write_text(json.dumps(metadata, indent=2) + '\n')
    hashes = []
    for file in sorted(staging.rglob('*')):
        if file.is_file():
            hashes.append(f'{hashlib.sha256(file.read_bytes()).hexdigest()}  {file.relative_to(staging)}')
    (staging / 'SHA256SUMS').write_text('\n'.join(hashes) + '\n')
    with tarfile.open(artifact, 'w:gz') as archive:
        for file in sorted(staging.iterdir()):
            archive.add(file, arcname=file.name)

checksum = hashlib.sha256(artifact.read_bytes()).hexdigest()
artifact.with_suffix(artifact.suffix + '.sha256').write_text(f'{checksum}  {artifact.name}\n')
print(artifact)
print(f'SHA256: {checksum}')
print(f'Release: {release_id}')
