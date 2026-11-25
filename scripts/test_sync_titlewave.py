#!/usr/bin/env python3
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent.parent

with tempfile.TemporaryDirectory(prefix="titlewave-sync-") as temporary:
    fixture = Path(temporary)
    script = fixture / "scripts" / "sync_titlewave.py"
    script.parent.mkdir()
    shutil.copy2(ROOT / "scripts" / script.name, script)
    source = fixture / "source"
    shutil.copytree(ROOT / "plugins" / "titlewave", source)
    destination = fixture / "plugins" / "titlewave"

    def run(path, *arguments):
        return subprocess.run([sys.executable, "-O", str(script), str(path), *arguments], capture_output=True, text=True)

    assert run(source).returncode == 0
    assert run(source, "--check").returncode == 0
    assert run(destination).returncode != 0
    assert (destination / "bin" / "titlewave.mjs").is_file()
    assert (destination / "hooks" / "start.mjs").is_file()
    assert (destination / "hooks" / "codex.json").is_file()
    assert (destination / "lib" / "resume.mjs").is_file()
    (destination / "obsolete.txt").write_text("stale")
    assert run(source, "--check").returncode != 0
    assert run(source).returncode == 0
    assert not (destination / "obsolete.txt").exists()
    if os.name != "nt":
        outside = fixture / "outside"
        (outside / "titlewave").mkdir(parents=True)
        sentinel = outside / "titlewave" / "sentinel"
        sentinel.write_text("keep")
        destination.parent.rename(fixture / "saved-plugins")
        destination.parent.symlink_to(outside, target_is_directory=True)
        assert run(source).returncode != 0
        assert sentinel.read_text() == "keep"
print("titlewave sync: overlap, stale-file, and optimized-mode path guards pass")
