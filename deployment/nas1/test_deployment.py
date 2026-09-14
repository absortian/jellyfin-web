"""Exercise install/rollback failures with a fake NAS; never contacts Docker."""
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


class DeploymentTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='absorflix-test-')
        self.addCleanup(self.temp.cleanup)
        root = Path(self.temp.name)
        self.release = root / 'release'
        self.compose = root / 'compose'
        self.bin = root / 'bin'
        for path in [self.release, self.compose, self.bin]:
            path.mkdir()
        self.original = 'version: "3.3"\nservices:\n  jellyfin:\n    image: linuxserver/jellyfin:10.11.6\n'
        (self.compose / 'docker-compose.yml').write_text(self.original)
        self.override = self.compose / 'docker-compose.override.yml'
        release_id = '10.11.6-absorflix-test'
        for relative, text in {
            'web/index.html': '<title>Absorflix</title>',
            'web/assets/audio/absorflix/intro.mp3': 'test audio',
            'web/absorflix-release.json': json.dumps({'release': release_id}),
            'RELEASE': release_id
        }.items():
            file = self.release / relative
            file.parent.mkdir(parents=True, exist_ok=True)
            file.write_text(text)
        for name in ['deploy.sh', 'rollback.sh']:
            shutil.copy2(Path(__file__).parent / name, self.release / name)
        files = [p for p in self.release.rglob('*') if p.is_file()]
        (self.release / 'SHA256SUMS').write_text('\n'.join(
            f'{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.relative_to(self.release)}' for p in files
        ) + '\n')
        mocks = {
            'id': 'echo 0',
            'sleep': 'exit 0',
            'docker': '''
if [[ "$1" == inspect ]]; then echo linuxserver/jellyfin:10.11.6; exit 0; fi
if [[ "$2" == config && "${TEST_FAIL_CONFIG:-}" == yes ]]; then exit 1; fi
if [[ "$2" == up ]]; then echo up >> "$TEST_LOG"; fi
exit 0''',
            'curl': '''
if [[ "$*" == *absorflix-release.json* ]]; then
    [[ "${TEST_FAIL_HEALTH:-}" != yes ]] || exit 22
    cat "$TEST_RELEASE/web/absorflix-release.json"
else
    echo '{"Version":"10.11.6"}'
fi'''
        }
        for name, code in mocks.items():
            script = self.bin / name
            script.write_text('#!/usr/bin/env bash\n' + code + '\n')
            script.chmod(0o755)
        self.env = {
            **os.environ,
            'PATH': str(self.bin) + os.pathsep + os.environ['PATH'],
            'ABSORFLIX_COMPOSE_DIR': str(self.compose),
            'TEST_LOG': str(root / 'operations.log'),
            'TEST_RELEASE': str(self.release)
        }

    def run_script(self, name='deploy.sh'):
        return subprocess.run(['bash', str(self.release / name)], env=self.env, capture_output=True, text=True, timeout=10)

    def test_install_and_rollback_preserve_original_compose(self):
        result = self.run_script()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('/usr/share/jellyfin/web:ro', self.override.read_text())
        self.assertEqual((self.compose / 'docker-compose.yml').read_text(), self.original)
        result = self.run_script('rollback.sh')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertFalse(self.override.exists())
        self.assertEqual((self.compose / 'docker-compose.yml').read_text(), self.original)

    def test_existing_unmanaged_override_is_not_changed(self):
        self.override.write_text('# user configuration\n')
        self.assertNotEqual(self.run_script().returncode, 0)
        self.assertEqual(self.override.read_text(), '# user configuration\n')
        self.assertFalse(Path(self.env['TEST_LOG']).exists())

    def test_failed_health_check_restores_previous_release(self):
        previous = '# Managed by Absorflix deployment\nservices: {}\n'
        self.override.write_text(previous)
        self.env['TEST_FAIL_HEALTH'] = 'yes'
        result = self.run_script()
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.override.read_text(), previous)
        self.assertEqual(Path(self.env['TEST_LOG']).read_text().splitlines(), ['up', 'up'])

    def test_invalid_compose_restores_original_web(self):
        self.env['TEST_FAIL_CONFIG'] = 'yes'
        self.assertNotEqual(self.run_script().returncode, 0)
        self.assertFalse(self.override.exists())

    def test_damaged_package_is_rejected_before_mutation(self):
        (self.release / 'web/index.html').write_text('corrupted')
        self.assertNotEqual(self.run_script().returncode, 0)
        self.assertFalse(self.override.exists())
        self.assertFalse(Path(self.env['TEST_LOG']).exists())

    def test_rollback_refuses_to_overwrite_a_later_change(self):
        self.assertEqual(self.run_script().returncode, 0)
        self.override.write_text('# later change\n')
        self.assertNotEqual(self.run_script('rollback.sh').returncode, 0)
        self.assertEqual(self.override.read_text(), '# later change\n')


if __name__ == '__main__':
    unittest.main()
