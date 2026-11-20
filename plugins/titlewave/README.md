# titlewave

![tests](https://img.shields.io/badge/tests-32%20passing-brightgreen) ![version](https://img.shields.io/badge/version-0.1.4-blue)

titlewave makes waves with better coding-agent session titles.

Ask your agent to "rename this session to Fix login", or run the CLI yourself.
The rename operation itself needs no model call. A natural-language request uses
the agent's normal model turn to select the skill or tool. Add `--terminal` to label the pane
or tab too. Names stay literal, including spaces, quotes, and Unicode.

Formerly session-rename. The old `lm-rename.sh` and `lm-rename.ps1` entry points
remain as Claude wrappers. The shared Node implementation replaces their
keystroke injection: a rename cannot become input to a shell or a busy agent.
Legacy wrappers need the session ID as their second argument, or an explicitly
exported `CLAUDE_CODE_SESSION_ID`. The plugin uses its hook context instead.
The legacy PowerShell wrapper requires `pwsh` 7.3+ for literal argument passing.

## Requirements

- Node 22 or later. No npm dependencies, build output, or API key for renaming.
- The relevant agent CLI, or a running OpenCode server.
- Windows subprocess adapters require native `.exe` CLIs on PATH. npm-only
  `.cmd` shims are rejected; OpenCode's HTTP adapter has no such requirement.
- Gemini and standalone Pi renames require a **closed session**. Pi's extension
  renames the running session through Pi's own API.

## Install

Claude Code:

```
/plugin marketplace add walangstudio/marketplace
/plugin install titlewave@walangstudio
```

Restart Claude Code, then `/titlewave:titlewave Fix login`, or ask in plain words.
The plugin supplies the current session ID through its SessionStart hook.

Codex:

```bash
codex plugin marketplace add walangstudio/marketplace
codex plugin add titlewave@walangstudio
```

Start a new thread, then ask Codex to rename it. The skill uses `CODEX_THREAD_ID`.
The marketplace carries the CLI with the skill; no separate install script.

Gemini CLI:

```bash
gemini extensions install https://github.com/walangstudio/titlewave
```

The extension explains the terminal-only command and safe offline rename.
It does **not** promise a live saved-session rename.

Pi:

```bash
pi install git:github.com/walangstudio/titlewave
```

Restart or `/reload`, then `/titlewave Fix login`. The `titlewave` tool also lets
Pi honor a plain-language request using `pi.setSessionName()`.

Goose:

```bash
goose plugin install https://github.com/walangstudio/titlewave
```

Goose 1.60.1 reads the portable skill from the Git-backed plugin. The skill uses
Goose's `AGENT_SESSION_ID`; the actual rename uses `goose session rename`.

OpenCode or another shell-capable agent:

```bash
git clone https://github.com/walangstudio/titlewave
node /absolute/path/titlewave/bin/titlewave.mjs --help
```

Ask the agent to read `skills/titlewave/SKILL.md` from the checkout. OpenCode can
also discover it through a symlink at `.opencode/skills/titlewave`. Keep the whole
checkout: the skill's `scripts/titlewave.mjs` launcher loads its shared runtime.
Copying only SKILL.md loses the runtime.

For OpenCode 1.x, add the context plugin to your existing `opencode.json`:

```json
{
  "plugin": ["file:///absolute/path/titlewave/extensions/opencode.mjs"]
}
```

It supplies the exact current session ID and owning server URL for NLP requests,
and registers `/titlewave <name>` without replacing an existing user command.
The hook was tested with OpenCode 1.17.11 and 1.19.6. Newer agents exposing a native
`session_rename` tool should use that tool; this hook does not establish 2.x support.

From an unpublished/local checkout, use `claude --plugin-dir /path/to/titlewave`,
`gemini extensions link /path/to/titlewave`, or `pi install /path/to/titlewave`.
The marketplace entries and Git install commands require the release to be
published. `install.sh` / `install.ps1` are optional legacy Claude skill links;
the marketplace plugin also installs the session-context hook.

## Commands

Plain-language requests distinguish the saved conversation from its terminal:

- `Rename this session to Fix login` changes the saved conversation name.
- `Rename this terminal window to Fix login` changes only its terminal label.
- `Rename this session and its terminal to Fix login` changes both.

Claude, Codex, and Goose discover the skill from their installed plugin. Pi exposes
its native `titlewave` tool and the portable skill. OpenCode 1.x needs the context
plugin above. The skill launcher requires explicit `--agent` and `--session`
values, so a nested agent cannot silently rename its parent's conversation.

If automatic selection fails, use Claude's `/titlewave:titlewave <name>`, Codex's
`$titlewave`, or OpenCode's `/titlewave <name>`. These select a prompt and still
need a model turn. Pi's `/titlewave <name>`, Claude's built-in `/rename <name>`,
and the direct CLI below perform the rename without a model request.

```bash
node bin/titlewave.mjs "Fix login" --agent codex --session <thread-id>
node bin/titlewave.mjs "Fix login" --agent claude --session <session-id>
node bin/titlewave.mjs "Fix login" --agent goose --session <session-id>
node bin/titlewave.mjs "Fix login" --agent opencode --session <session-id> --url http://127.0.0.1:4096
node bin/titlewave.mjs "Fix login" --agent pi --session /path/session.jsonl --offline
node bin/titlewave.mjs "Fix login" --agent gemini --session <session-id> --transcript /path/session.jsonl --offline
node bin/titlewave.mjs terminal "Fix login"
```

`--agent` can be omitted when exactly one recognized session environment is
present. Ambiguous or missing context fails instead of guessing the latest chat.
OpenCode needs its owning server's URL; authenticated servers use
`OPENCODE_SERVER_PASSWORD` and optional `OPENCODE_SERVER_USERNAME`.

Add `--terminal` only when renaming the session in the current pane. Renaming an
explicit different session never implies relabeling its terminal. `--dry-run`
prints the request without running an agent, writing a file, or emitting escapes.
Names must contain 1-200 characters and cannot start with a dash or contain
control characters or invisible formatting.

## Agent compatibility

Tested 2026-11-19 with real release binaries in an isolated Linux Docker container.
CI fixtures contain a local user message; **no model turn or paid request** is made.
The integration check writes evidence to `.evidence/agents.json`.
Claude Code, Codex, and Pi were also exercised through their native Windows
executables. OpenCode, Goose, and Gemini's saved-session checks ran on Linux.

| Agent | Tested version | Saved rename | Verification |
| --- | --- | --- | --- |
| Claude Code | 2.1.328 | Client-side `-p --resume ID "/rename NAME"` | Real resumable transcript receives `custom-title` |
| Codex | 0.170.0 | App-server `thread/name/set` | A second app-server reads the persisted name |
| OpenCode | 1.19.6 | Owning server's `PATCH /session/:id` | Real server creates a session, saves and returns its title |
| Pi | 0.80.2 | Extension `setSessionName`; offline RPC `set_session_name` | Real extension loads and executes its command; reopened RPC reads the name |
| Goose | 1.60.1 | `goose session rename` | Real CLI imports, renames, and lists a session |
| Gemini CLI | 0.69.0 | Offline summary metadata, JSON or JSONL | Real `--list-sessions` displays the changed JSONL summary |

Gemini has no documented rename command. Titlewave changes only the summary of
an explicitly selected closed transcript; JSONL appends a `$set` record, legacy
JSON uses an atomic replacement. Never pass `--offline` for a running process.
Legacy JSON preservation is covered by a regression check; the real CLI check
uses its current JSONL format.

Manual NLP checks ran on 2026-11-20. Claude, Codex, OpenCode, Pi, and Goose received
`Rename this session to <unique title>` and their persisted titles were verified.
Gemini's terminal and closed-session prompts are described below. Terminal-only
checks queried the actual visible xterm window title. These authenticated model
runs are separate from CI's model-free integration checks:

| Agent | NLP-tested version and platform | Model | Result |
| --- | --- | --- | --- |
| Claude Code | 2.1.328, Linux Docker | Claude Haiku 4.5 through OpenRouter | Skill selected; resumable transcript title confirmed |
| Codex | 0.170.0, Linux Docker | Configured Codex model | Installed marketplace skill selected; app-server title confirmed |
| OpenCode | 1.17.11, Windows | NVIDIA Nemotron 3 Ultra | Context plugin and skill selected; server title confirmed |
| Pi | 0.80.2, Windows | NVIDIA Nemotron 3 Ultra | Native tool selected; session metadata confirmed |
| Goose | 1.60.1, Linux Docker | OpenRouter free router | Installed skill selected; saved session name confirmed |
| Gemini CLI | 0.69.0, Linux Docker on Intel Mac | Gemini 3.5 Flash-Lite | Installed skill selected; visible terminal title and a separate closed session's saved summary confirmed |

The Codex terminal-only NLP check also confirmed the saved conversation name
stayed unset. Gemini's authenticated check loaded the extension and skill and
renamed a real xterm window from a workspace outside the plugin checkout. A
second request renamed that closed session, preserved its existing transcript,
and confirmed the new summary through `gemini --list-sessions`. These checks do
not establish terminal NLP behavior for every agent. Gemini can label its
terminal while running; its own live saved summary remains unsupported. Rename
only an explicitly identified closed session with `--offline`. A slash command
does not remove that restriction. NLP selection depends on the model and available tools.

The Claude child disables hooks and excludes configured MCP servers so a rename
does not replay SessionStart hooks or start unrelated tool servers.

The live header is separate from saved storage. Claude and Codex may retain a
cached header until refresh or resume. Pi's extension updates the running agent.
Claude users can run `cc-title-statusline.sh` to read the saved title on each
statusline refresh (requires Bash and jq):

```json
{
  "statusLine": {
    "type": "command",
    "command": "bash /absolute/path/titlewave/cc-title-statusline.sh"
  }
}
```

Append your existing statusline executable to wrap it. Settings take effect in
a new Claude session. The helper forwards the same stdin JSON to the wrapper.

## Terminal compatibility

Terminal labels are optional and independent of saved conversation names.
For generic OSC output, the CLI reports that an escape was sent, without
claiming that a visible tab changed. Recognized hosts report their CLI result.
Multiplexers take priority over outer emulators. Titlewave addresses the caller's
pane rather than whichever pane happens to have focus. It never sends `/rename`
or other keystrokes. An agent can overwrite an OSC title later.
When multiple multiplexer contexts are inherited, titlewave refuses to guess
which layer to label; clear the outer context or omit `--terminal`.

| Terminal | Tested version | Platform | Check |
| --- | --- | --- | --- |
| tmux | 3.3a | Linux | Real pane/window titles; split windows keep their window title |
| GNU Screen | 4.09.00 | Linux | Real selected window title queried from the running server |
| Zellij | 0.46.0 | Linux | Calling pane ID targeted and real pane title read back through `list-panes` |
| kitty | 0.26.5 | Linux | Real X11 window title; requires `allow_remote_control yes` |
| xterm | 379 | Linux | Real X11 title from OSC 2 sent to the controlling TTY |
| rxvt-unicode | 9.30 | Linux | Real X11 title from OSC 2 |
| Alacritty | 0.11.0 | Linux | Real X11 title from OSC 2 |
| Ghostty | 1.4.0-arch1 | Linux | Linux X11 window title and native Wayland compositor title from OSC 2 |
| foot | 1.28.0 | Linux | Native Wayland title read back through Sway IPC |
| GNOME Terminal | 3.60.0 | Linux | Real X11 window title from OSC 2 |
| Konsole | 26.08.3 | Linux | Real X11 title with the tab-title format set to `%w` |
| Xfce Terminal | 1.2.0 | Linux | Real X11 window title from OSC 2 |
| Terminator | 2.1.6 | Linux | Real X11 window title from OSC 2 |
| Rio | 0.5.32 (Arch -1) | Linux | Linux X11 window title and native Wayland compositor title from OSC 2 |
| Contour | 0.7.0.8982 (Arch -2) | Linux | Linux X11 window title and native Wayland compositor title from OSC 2 |
| Herdr | 0.9.4-preview.2026-10-14-fbd2ae23927f | Windows | Native Windows pane label read back through `pane get` |
| WezTerm | 20240203-110809-5046fc22 | Windows | Native Windows tab label read back through `cli list` |
| Windows console | Windows 10.0.26300 | Windows | OSC 2 sent through `CONOUT$`, read back through the console title API |
| Terminal.app | 2.12.7 | macOS 12.7.6, Intel | Real native window title, literal text, replacement, and invalid-input preservation |

X11 checks run real emulators under Xvfb and query their window titles, rather
than just comparing emitted bytes. `python3 test/terminals.py` reproduces them.
The eight checks include a detached tool process with no controlling TTY.
The test creates and closes only its own processes.
For that detached case, titlewave finds the nearest ancestor TTY with `/bin/ps`.
Normal terminal processes still write directly to `/dev/tty`. Run terminal-label
tools without allocating an extra PTY, which can capture OSC output instead of
forwarding it to the visible terminal.
The eight newer Linux terminals are installed and tested entirely inside the
separate `test/desktop.Dockerfile` image. Its 13 checks run as an unprivileged
container user: X11 window queries, native Wayland titles through a headless
Sway compositor, and negative checks for Ghostty and Rio's fixed-title settings. No host
terminal applications, display sockets, GPU devices, or privileged container
access are required. Exact installed versions and observed titles are written
to `.evidence/desktop-terminals.json` inside the container.

Ghostty's `title` configuration must be unset; a fixed value deliberately
ignores application title changes. Rio's `--title` option also locks its title.
Konsole's tab-title format must contain
`%w` (the title supplied by the shell). The test applies that setting to its own
temporary Konsole process, without changing a saved profile. A shell prompt or
agent can replace an OSC title later. These checks establish Linux support;
Ghostty on macOS has not been tested.

The desktop suite also passed on an Intel Mac using Docker Desktop 4.40.0
(Engine 28.0.4, Linux amd64). Terminal installation and execution stayed inside
containers. This verifies Linux builds on a Mac-hosted engine; it does not verify
native macOS builds. Terminal.app was tested separately on the host; iTerm2 remains unverified.

For the opt-in native Terminal.app check, run `open test/macos.command` on a Mac.
It opens a fresh single-tab window, queries its actual title through AppleScript,
and closes only that test window. Node 22+ must be on the GUI shell's PATH. For a
custom Node path, open a fresh Terminal window and run
`TITLEWAVE_NODE=/absolute/path/node test/macos.command` from the checkout.
Allow the Terminal automation prompt if macOS asks. Evidence is written to
`.evidence/macos-terminal-<pid>.json`; check both its results and cleanup status.
The initial three native cases passed; a later four-case rerun, adding the
detached-process case, was blocked by AppleEvent timeouts and remains unverified.

`powershell -NoProfile -File test/windows.ps1` checks running Herdr and WezTerm
servers using temporary panes. The Windows console check uses its own hidden
PowerShell console; it does not establish Windows Terminal tab compatibility.

Other OSC-capable terminals may work, but are not listed as verified. Native macOS
builds beyond Terminal.app, Windows Terminal tabs, and Rex have not been exercised here. Unsupported or
unavailable terminal control reports an error; `--terminal` still preserves a
successful saved-session rename. A standalone `terminal` failure exits nonzero.

## Develop

```bash
npm run build
npm test
npm run test:integration
python3 test/terminals.py
node test/packages.mjs
claude plugin validate .
```

The build checks syntax and manifest versions. Unit tests use Node's built-in
test runner. Integration checks require the exact installed CLIs above; they
use temporary homes and keep fixture evidence for inspection.

`test/Dockerfile` installs those releases and Linux terminal dependencies.
Build it with `docker build -f test/Dockerfile -t titlewave-test .`, then run
`docker run --rm --init titlewave-test`. GUI tests use software rendering under Xvfb.
No real credentials or user conversation directories are mounted.

For Ghostty and the other desktop terminals:

```bash
docker build -f test/desktop.Dockerfile -t titlewave-desktop-test .
docker run --rm --init --memory=3g --cpus=3 titlewave-desktop-test
```

This second image uses a pinned Arch Linux base and the signed 2026-11-18 Arch
Linux Archive snapshot. Installed versions and observed titles are also printed
in the CI log. CI runs both container suites. Keep terminal
installation and execution inside these images; the Windows checks above record
the earlier native-host verification and are not needed for the Docker suites.

Layout: `bin/` is the CLI, `lib/` contains agent and terminal adapters, `skills/`
is the portable procedure, `extensions/pi.mjs` uses Pi's in-process API, and
`hooks/` supplies Claude's session identity. `.claude-plugin/` and
`.codex-plugin/` are the marketplace manifests. The Codex marketplace copy is
refreshed with `python scripts/sync_titlewave.py <titlewave-checkout>` from the
marketplace checkout.
The Codex marketplace copy contains the runtime and skill. Shell wrappers,
the optional statusline helper, hooks, and development checks live in the source
repository; paths to those files in this README refer to a source checkout.

## References

- [Codex app-server protocol](https://github.com/openai/codex/tree/main/codex-rs/app-server)
- [OpenCode server and SDK](https://opencode.ai/docs/sdk/)
- [Pi extensions](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/extensions.md)
- [Pi RPC commands](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/rpc-commands.md)
- [Goose session management](https://github.com/aaif-goose/goose/blob/main/documentation/docs/guides/sessions/session-management.md)
- [Gemini session recording at the tested release](https://github.com/google-gemini/gemini-cli/blob/v0.69.0/packages/core/src/services/chatRecordingService.ts)
- [Ghostty title configuration](https://ghostty.org/docs/config/reference#title)
- [Konsole tab-title formats](https://docs.kde.org/stable_kf6/en/konsole/konsole/console-dialogs.html)
- [Rio installation and platforms](https://rioterm.com/docs/install)
- [Contour installation and platforms](https://contour-terminal.org/install/)

## License

MIT, copyright walangstudio.
