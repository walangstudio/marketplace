# walangstudio marketplace

Claude Code plugin marketplace for [Walang Studio](https://github.com/walangstudio).

## Use

```
/plugin marketplace add walangstudio/marketplace
/plugin install <plugin>@walangstudio
```

## Plugins

| Plugin | What it does |
| --- | --- |
| [shellter](https://github.com/walangstudio/shellter) | PreToolUse security hooks: gate dangerous Bash/PowerShell/cmd, scan executed-script contents, block sensitive-file access and prompt injection. |

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
