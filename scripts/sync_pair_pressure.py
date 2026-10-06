#!/usr/bin/env python3
"""Refresh the vendored Codex pair-pressure wrapper from a source checkout."""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
DESTINATION = ROOT / "plugins" / "pair-pressure"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path, help="pair-pressure source checkout")
    args = parser.parse_args()
    source = args.source.resolve()

    required = [
        source / ".codex-plugin" / "plugin.json",
        source / ".mcp.json",
        source / "skills" / "pair-pressure" / "SKILL.md",
        source / "skills" / "pair-pressure" / "CONVENTIONS.md",
    ]
    missing = [str(path) for path in required if not path.is_file()]
    if missing:
        raise SystemExit("missing source files: " + ", ".join(missing))

    if DESTINATION.exists():
        shutil.rmtree(DESTINATION)
    (DESTINATION / ".codex-plugin").mkdir(parents=True)
    (DESTINATION / "skills" / "pair-pressure").mkdir(parents=True)

    shutil.copy2(required[0], DESTINATION / ".codex-plugin" / "plugin.json")
    shutil.copy2(required[1], DESTINATION / ".mcp.json")
    shutil.copy2(required[2], DESTINATION / "skills" / "pair-pressure" / "SKILL.md")
    shutil.copy2(
        required[3], DESTINATION / "skills" / "pair-pressure" / "CONVENTIONS.md"
    )
    print(f"synced pair-pressure Codex wrapper from {source}")


if __name__ == "__main__":
    main()
