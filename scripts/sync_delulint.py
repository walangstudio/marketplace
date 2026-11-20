#!/usr/bin/env python3
"""Refresh the Codex delulint package from its source checkout."""

import argparse
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILES = [
    ".codex-plugin/plugin.json", "package.json", "hooks/guard.mjs",
    "skills/delulint/SKILL.md", "skills/delulint/verifier.md",
    "skills/delulint/scripts/archive.mjs",
    "README.md", "LICENSE", "CHANGELOG.md",
]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    source = args.source.resolve()
    for file in FILES:
        if not (source / file).is_file():
            raise SystemExit(f"missing source file: {source / file}")
    destination = ROOT / "plugins" / "delulint"
    if source == destination or source.is_relative_to(destination) or destination.is_relative_to(source):
        raise SystemExit("source and generated destination must not overlap")
    if destination.resolve() != ROOT.resolve() / "plugins" / "delulint" or destination.is_symlink() or destination.parent.is_symlink():
        raise SystemExit("generated destination must remain inside this checkout")
    if args.check:
        actual = {str(path.relative_to(destination).as_posix()) for path in destination.rglob("*") if path.is_file()}
        if actual != set(FILES):
            raise SystemExit("generated package has missing or extra files")
        for file in FILES:
            if (destination / file).read_bytes() != (source / file).read_bytes():
                raise SystemExit(f"stale generated file: {destination / file}")
        print("delulint Codex package matches source")
        return
    if destination.exists():
        shutil.rmtree(destination)
    for file in FILES:
        target = destination / file
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source / file, target)
    print(f"synced delulint Codex package from {source}")


if __name__ == "__main__":
    main()
