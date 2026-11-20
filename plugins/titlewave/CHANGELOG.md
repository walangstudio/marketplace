# Changelog

## 0.1.4 - 2026-11-20

- Verify authenticated Gemini NLP for a visible terminal title and a separate closed session's saved summary in Mac-hosted Docker.
- Scope the Claude SessionStart hook to its manifest so Gemini extensions do not execute it.
- Add a regression check for the isolated hook and its exact session context.
- Wait for Konsole's window to map before the desktop test sends its first title.
- Preinstall the pinned OpenCode plugin SDK in the test image to avoid registry timeouts during integration startup.

## 0.1.3 - 2026-11-20

- Verify natural-language saved-session renaming with real Claude, Codex, OpenCode, Pi, and Goose model turns.
- Give the skill a local launcher and require explicit agent/session targets to protect parent conversations.
- Add OpenCode 1.x current-session context and a `/titlewave` fallback; include the portable skill in Pi packages.
- Route terminal-only requests separately and recover the parent TTY when an agent's tool process has no controlling terminal.
- Verify native Terminal.app 2.12.7 on macOS 12.7.6 and add an opt-in native window check.
- Stop RPC children that ignore graceful termination, preventing a completed rename from hanging.
- Allow 90 seconds for cold Claude CLI startup and stop the child if that deadline expires.
- Expand unit checks to 31 and add real detached-process and subprocess-cleanup regressions.

## 0.1.2 - 2026-11-20

- Verify Rio and Contour titles on Linux X11 and Wayland inside Docker on an Intel Mac.
- Check Rio's fixed-title restriction and expand the desktop suite to 13 checks.
- Document the distinction between Mac-hosted Linux containers and unverified native macOS terminals.

## 0.1.1 - 2026-11-19

- Verify Ghostty on Linux X11 and native Wayland inside Docker.
- Add real desktop-title checks for foot, GNOME Terminal, Konsole, Xfce Terminal, and Terminator.
- Document Ghostty's fixed-title restriction and Konsole's `%w` tab-title requirement.
- Run the additional desktop-terminal container suite in CI without host display access or elevated container privileges.
- Allow cold agent RPC startup more time on loaded machines while retaining shorter deadlines for later requests.

## 0.1.0 - 2026-11-19

- Rename session-rename to titlewave.
- Share a dependency-free Node CLI across Windows, Linux, and macOS.
- Add Claude Code and Codex plugin packages, a Gemini extension, and a Pi package.
- Rename through native Claude, Codex, OpenCode, Pi, and Goose interfaces.
- Support closed Gemini session summaries with an explicit offline safeguard.
- Label terminals separately from saved sessions; never inject input into a running agent.
- Add runnable agent, terminal, packaging, and regression checks.
