"""Check preservation and failure recovery using isolated, retained fixtures."""
import hashlib
import os
from pathlib import Path
import subprocess
import tempfile
import unittest


class OverlayTest(unittest.TestCase):
    def setUp(self):
        self.root = Path(tempfile.mkdtemp(prefix='absorflix-overlay-test-'))
        self.web = self.root / 'live'
        self.release = self.root / 'release'
        self.bin = self.root / 'bin'
        for path in [self.web, self.release / 'web', self.bin]:
            path.mkdir(parents=True)
        self.original = {'index.html': 'old login', 'runtime.js': 'old runtime',
                         'absorflix-release.json': '{}', 'retained.apk': 'keep APK'}
        for name, content in self.original.items():
            (self.web / name).write_text(content)
        for name, content in {'index.html': 'new login', 'runtime.js': 'new runtime',
                              'new.css': 'new styles', 'absorflix-release.json': '{"new":true}'}.items():
            (self.release / 'web' / name).write_text(content)
        (self.release / 'SHA256SUMS').write_text(''.join(
            f'{hashlib.sha256(p.read_bytes()).hexdigest()}  web/{p.name}\n'
            for p in (self.release / 'web').iterdir()))
        mocks = {
            'docker': '''
if [[ "$*" == *Config.Image* ]]; then echo linuxserver/jellyfin:10.11.6
else printf '%s\\n' "$TEST_WEB"; fi''',
            'curl': 'exit 0',
            'mv': '''
if [[ "${FAIL_INDEX:-}" == yes && "${*: -1}" == */index.html ]]; then exit 1; fi
exec /bin/mv "$@"'''
        }
        for name, code in mocks.items():
            path = self.bin / name
            path.write_text('#!/usr/bin/env bash\n' + code + '\n')
            path.chmod(0o755)
        self.env = dict(os.environ, PATH=f'{self.bin}:{os.environ["PATH"]}', TEST_WEB=str(self.web))

    def run_overlay(self):
        return subprocess.run(['bash', str(Path(__file__).with_name('apply-web-overlay.sh')),
                               str(self.release)], env=self.env, capture_output=True, text=True)

    def test_success_retains_old_assets_and_backs_up_replacements(self):
        result = self.run_overlay()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual((self.web / 'index.html').read_text(), 'new login')
        self.assertEqual((self.web / 'retained.apk').read_text(), 'keep APK')
        self.assertEqual((self.release / 'overlay-backup/web/index.html').read_text(), 'old login')

    def test_corruption_is_rejected_before_any_changes(self):
        (self.release / 'web/index.html').write_text('corrupted')
        self.assertNotEqual(self.run_overlay().returncode, 0)
        self.assertFalse((self.release / 'overlay-backup').exists())
        self.assertEqual((self.web / 'index.html').read_text(), 'old login')

    def test_failed_entry_page_publish_restores_all_previous_files(self):
        self.env['FAIL_INDEX'] = 'yes'
        result = self.run_overlay()
        self.assertNotEqual(result.returncode, 0)
        for name, content in self.original.items():
            self.assertEqual((self.web / name).read_text(), content)
        self.assertIn('previous files restored', result.stderr)


if __name__ == '__main__':
    unittest.main()
