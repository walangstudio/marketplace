#!/usr/bin/env python3
"""Refresh the Codex titlewave package from its source checkout."""

import argparse
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    source = args.source.resolve()
    files = [
        ".codex-plugin/plugin.json", "package.json", "bin/titlewave.mjs",
        "lib/agents.mjs", "lib/rpc.mjs", "lib/terminal.mjs",
        "skills/titlewave/SKILL.md", "skills/titlewave/scripts/titlewave.mjs",
        "README.md", "LICENSE", "CHANGELOG.md",
    ]
    for file in files:
        if not (source / file).is_file():
            raise SystemExit(f"missing source file: {source / file}")
    destination = ROOT / "plugins" / "titlewave"
    if source == destination or source.is_relative_to(destination) or destination.is_relative_to(source):
        raise SystemExit("source and generated destination must not overlap")
    if destination.resolve() != ROOT.resolve() / "plugins" / "titlewave" or destination.is_symlink() or destination.parent.is_symlink():
        raise SystemExit("generated destination must remain inside this checkout")
    if args.check:
        actual = {str(path.relative_to(destination).as_posix()) for path in destination.rglob("*") if path.is_file()}
        if actual != set(files):
            raise SystemExit("generated package has missing or extra files")
        for file in files:
            target = destination / file
            if not target.is_file() or target.read_bytes() != (source / file).read_bytes():
                raise SystemExit(f"stale generated file: {target}")
        print("titlewave Codex package matches source")
        return
    if destination.exists():
        shutil.rmtree(destination)
    for file in files:
        target = destination / file
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source / file, target)
    print(f"synced titlewave Codex package from {source}")


if __name__ == "__main__":
    main()
