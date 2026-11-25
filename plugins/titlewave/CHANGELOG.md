# Changelog

## 0.2.0 - 2026-11-25

- Restore saved session titles on resume through Claude, Codex, Gemini, Pi, and Goose lifecycle integrations, including Claude forked resumes.
- Add an immediate Codex resume launcher; native Codex queues its lifecycle hook until the first message.
- Add an OpenCode client-side TUI plugin that follows the selected session without trusting shared server events.
- Reuse terminal targeting and split-pane protections; refuse stale Codex daemon environments without blocking resume.
- Read native saved titles without model calls, transcript edits, or a pane cache.
- Exercise restoration through the Linux terminal suites, native Windows Herdr, WezTerm, and console checks, and native macOS Terminal.app.

## 0.1.7 - 2026-11-23

- Align the current session's terminal label through the skill when its title differs, while preserving explicit saved-only requests and the CLI's opt-in flag.
- Refuse inherited terminal targets in Codex shared-daemon contexts; accept a verified `--herdr-pane` instead.
- Check the exact fully qualified Herdr pane ID before mutation, rejecting context-dependent aliases.
- Cover stale daemon targets with a two-tab native regression and 34 unit checks.
- Document Claude's verified short `/titlewave` alias and the shared-server limitation.
- Disable the desktop downloader's ten-second stall timeout inside a five-minute deadline per attempt; retain interrupted download progress and keep installation outside that deadline.

## 0.1.6 - 2026-11-23

- Report partial terminal-label failures without claiming that all labels stayed unchanged.
- Include Herdr context when its first pane lookup fails.
- Document the required Herdr pane/tab lookup and rename APIs, verified on 0.9.4-preview.2026-10-14-fbd2ae23927f.
- Reject surrounding whitespace before Herdr can silently trim a label; cover this with the 33rd unit check.
- Try snapshot package downloads up to three times with backoff, preserving cached packages and native timeouts.
- Remove the desktop test image's package cache directly, including pacman's temporary download directories.

## 0.1.5 - 2026-11-23

- Rename Herdr's visible tab along with its pane when the tab contains one pane.
- Keep shared tab and neighboring pane labels unchanged in split Herdr layouts.
- Resolve the tab from the live pane and verify saved labels before reporting success.
- Reproduce the Windows tab-label failure and cover single-pane and split-tab behavior in the native regression checks.
- Allow cold desktop-terminal startup before checking visible labels.

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
