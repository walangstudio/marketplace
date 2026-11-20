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
unchanged. A session, chat, or conversation request changes only the saved name.
For an explicit request to rename both, add `--terminal` to the saved rename.
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
