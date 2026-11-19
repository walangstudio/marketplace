---
name: titlewave
description: Rename or retitle a coding-agent session when the user asks to name this chat, conversation, or session. Supports Claude Code, Codex, OpenCode, Pi, Goose, and closed Gemini sessions; can also label the current terminal.
argument-hint: "<new-name>"
---

Use the user's exact name. If no name was provided, ask for one.

Resolve `../../bin/titlewave.mjs` relative to this skill's directory. Always quote
the absolute script path and the name as separate shell arguments. Do not
interpolate a name into a shell expression; use the host shell's literal quoting.

Run `node <absolute-script-path> <name> --agent <agent> --session <id>`.
Claude Code supplies the session ID in the SessionStart context. Codex exposes
`CODEX_THREAD_ID`. For Goose, use its supplied session ID. For OpenCode, use the
session ID and the owning server's loopback URL (`--url`); ask if unavailable.
Never guess the newest session or read unrelated conversation contents.
If Codex exposes a native task-title tool, prefer it for the current task.

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
