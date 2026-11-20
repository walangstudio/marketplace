# Changelog

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
