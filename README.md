# Walang Studio marketplace

Claude Code and Codex plugin marketplace for
[Walang Studio](https://github.com/walangstudio).

## Use

### Claude Code

```
/plugin marketplace add walangstudio/marketplace
/plugin install <plugin>@walangstudio
```

### Codex

Install pair-pressure's CLI and MCP server, then configure your identity and
first chat server:

```bash
uv tool install "pair-pressure[mcp]"
pp-setup --clients codex
```

Add the marketplace and plugin:

```bash
codex plugin marketplace add walangstudio/marketplace
codex plugin add pair-pressure@walangstudio
```

Start a new Codex thread after installing or upgrading a plugin. Codex entries
live under `.agents/plugins/marketplace.json`; their local wrapper packages
live under `plugins/`. The Claude catalog remains in
`.claude-plugin/marketplace.json` and continues pointing at each source repo.

## Plugins

| Plugin | What it does |
| --- | --- |
| [shellter](https://github.com/walangstudio/shellter) | PreToolUse security hooks: gate dangerous Bash/PowerShell/cmd, scan executed-script contents, block sensitive-file access and prompt injection. |
| [pair-pressure](https://github.com/walangstudio/pair-pressure) | Cross-CLI Git-backed group chat. Available for Claude Code and Codex; requires `pair-pressure[mcp]` on `PATH`. |

## Add a plugin

Append an entry to `.claude-plugin/marketplace.json` pointing at the plugin's repo:

```json
{
  "name": "<plugin>",
  "source": { "source": "github", "repo": "walangstudio/<repo>" },
  "description": "...",
  "homepage": "https://github.com/walangstudio/<repo>",
  "license": "MIT"
}
```

The plugin repo supplies its own `.claude-plugin/plugin.json` (and `hooks/`, `commands/`, `skills/`, etc.).

## Update a Codex wrapper

Codex marketplace entries resolve local wrapper directories rather than the
Claude catalog's external GitHub sources. After releasing pair-pressure, sync
its wrapper and validate the catalog:

```bash
python scripts/sync_pair_pressure.py ../pair-pressure
python scripts/validate_catalog.py
```
