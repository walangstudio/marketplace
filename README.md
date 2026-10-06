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
| [psst](https://github.com/walangstudio/psst) | Ask another Claude model one question without leaving your session: `/s` `/h` `/o` `/f`. |
| [chatfish](https://github.com/walangstudio/chatfish) | Fake Twitch chat pane that reacts to what Claude is doing and to your replies. Requires Claude Code 2.1.281+ with `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1`. |

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
