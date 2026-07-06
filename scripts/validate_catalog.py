#!/usr/bin/env python3
"""Validate local Codex marketplace entries using only the standard library."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / ".agents" / "plugins" / "marketplace.json"


def main() -> None:
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    assert catalog["name"] == "walangstudio"
    assert catalog["interface"]["displayName"] == "Walang Studio"

    names: set[str] = set()
    for entry in catalog["plugins"]:
        name = entry["name"]
        assert name not in names, f"duplicate plugin entry: {name}"
        names.add(name)
        assert entry["policy"]["installation"] in {
            "NOT_AVAILABLE",
            "AVAILABLE",
            "INSTALLED_BY_DEFAULT",
        }
        assert entry["policy"]["authentication"] in {"ON_INSTALL", "ON_USE"}
        assert entry["category"]

        source = entry["source"]
        assert source["source"] == "local"
        assert source["path"] == f"./plugins/{name}"
        plugin_root = ROOT / "plugins" / name
        manifest = json.loads(
            (plugin_root / ".codex-plugin" / "plugin.json").read_text(
                encoding="utf-8"
            )
        )
        assert manifest["name"] == name
        assert (plugin_root / manifest["skills"]).is_dir()
        mcp_servers = manifest["mcpServers"]
        if isinstance(mcp_servers, str):
            assert (plugin_root / mcp_servers).is_file()
        else:
            assert isinstance(mcp_servers, dict) and mcp_servers
            assert all(server.get("command") for server in mcp_servers.values())

    print(f"validated {len(names)} Codex marketplace plugin(s)")


if __name__ == "__main__":
    main()
