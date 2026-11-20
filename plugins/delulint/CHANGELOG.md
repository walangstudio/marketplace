# Changelog

## 0.1.1 - 2026-11-20

- Give every claim a neutral `check:` line, so the verifier tests whether a TODO's work is done, a plan was dropped, or a rule is followed, not whether the text exists.
- Split compound claims and list status-less specs during inventory.
- Report claims that were wrong when written; forbid the verifier from running tests or scripts.
- Add `bench/`: a seeded repo with an answer key. Opus, Sonnet, and Codex each found 9/9 with no false positives.

## 0.1.0 - 2026-11-20

- Add the delulint skill for Claude Code and Codex: inventory, claim extraction, independent verification, report, and approved archiving.
- Add the read-only verifier prompt shared by Claude subagents and `codex exec`.
- Add `archive.mjs`, which moves approved files into `.archive/` with `git mv` and an `.ignore` file.
- Add a `PreToolUse` guard that blocks file tools, shell reads, and Codex patches inside `.archive/`.
