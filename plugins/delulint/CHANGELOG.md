# Changelog

## 0.1.0 - 2026-11-20

- Add the delulint skill for Claude Code and Codex: inventory, claim extraction, independent verification, report, and approved archiving.
- Add the read-only verifier prompt shared by Claude subagents and `codex exec`.
- Add `archive.mjs`, which moves approved files into `.archive/` with `git mv` and an `.ignore` file.
- Add a `PreToolUse` guard that blocks file tools, shell reads, and Codex patches inside `.archive/`.
