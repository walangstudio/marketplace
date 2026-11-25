---
name: titlewave
description: Rename or retitle a coding-agent chat, conversation, or session, or label its terminal window, tab, or pane, when the user asks to name or rename it.
---

Use the user's exact name. If no name was provided, ask for one.

Use `scripts/titlewave.mjs` inside this skill's directory. Resolve symlinks first.
This launcher loads the shared runtime from the installed plugin; do not look for
`bin/` inside the skill directory. Always quote the absolute launcher path and
the name as separate shell arguments. Do not
interpolate a name into a shell expression; use the host shell's literal quoting.

For a window, tab, pane, or terminal-only request, run
`node <absolute-script-path> terminal <name>`. Leave the saved conversation name
unchanged. An explicit saved-session-only request changes only the saved name.
For the current session, also keep its terminal label aligned with the requested
name unless the user explicitly asks for a saved-session-only rename. When the
terminal label differs, add `--terminal` to the saved rename. If the label cannot
be read but the target terminal is verified, attempt `--terminal` and report its
actual result. When a native rename tool changes only the saved name, follow it
with `terminal <name>` if the terminal label still needs updating.
Run terminal-label commands without allocating another PTY. An extra tool PTY
can capture title escapes instead of forwarding them to the visible window.

Run `node <absolute-script-path> <name> --agent <agent> --session <id>`.
Always supply both flags for a saved rename. An inherited variable from another
agent is not evidence of the current session. The launcher refuses implicit targets.
Claude Code supplies the session ID in the SessionStart context. Codex exposes
`CODEX_THREAD_ID`. Goose exports `AGENT_SESSION_ID` to tools with `AGENT=goose`;
use that exact ID, never an ID guessed from a directory name. For OpenCode, use the
session ID and the owning server's loopback URL (`--url`); ask if unavailable.
Never guess the newest session or read unrelated conversation contents.
Prefer a native current-session rename tool when the host exposes one, such as
Codex's task-title tool, OpenCode's `session_rename`, or Pi's `titlewave` tool.

Codex's shared daemon inherits its first terminal's environment. When
`CODEX_DAEMON_SHUTDOWN_SOCKET` is present, inherited terminal IDs and Herdr agent
session metadata do not prove which pane owns this conversation. For Herdr,
get the user's confirmed fully qualified pane ID and add `--herdr-pane <id>`
to the terminal command or saved rename with `--terminal`. Never choose by focus,
working directory, or the first matching agent. If no verified target is
available, leave terminal labels unchanged and ask for the pane ID. Starting a
new Codex client with `--no-daemon` avoids the shared environment; do not stop
or restart the user's shared server.

Resuming a named session normally restores its terminal title through the agent's
hook or UI extension. Codex delays its native hook until the first message. For
an immediate update, give the user `node <script> --resume <exact Codex session ID>`
to run in their own terminal. Do not launch it through a captured tool session or
allocate an extra PTY to make it pass the interactive check.

Pi: use the extension's `titlewave` tool, or `/titlewave <name>`. Its standalone
CLI requires `--offline --session <session.jsonl>` and a closed session.

Gemini: while running, only `node <script> terminal <name>` is safe. Explain that
this labels the terminal, not the saved conversation. After closing Gemini:
`node <script> <name> --agent gemini --session <id> --offline --transcript <session.json>`.
Do not edit the live transcript or pass `--offline` for a running session.

Add `--terminal` only for the current session, never when targeting another one.
An optional terminal failure does not undo a successful saved-session rename.
Report the CLI's actual result. Never claim a header repainted because storage
changed. Never type a built-in slash command as reply text or inject keystrokes.
