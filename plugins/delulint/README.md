# delulint

![tests](https://img.shields.io/badge/tests-9%20passing-brightgreen) ![version](https://img.shields.io/badge/version-0.1.1-blue)

delulint lints your repo's delusions: the notes, plans, specs, and agent instructions that no longer match the code.

Coding agents read all of it and believe all of it. Google measured what that costs in [Agent Distraction](https://developers.googleblog.com/en/agent-distraction/): sessions that chased a stale note took 70% more steps, 77% more tokens, and twice as long. delulint finds those notes, proves each one stale against the code and git history, and archives what you approve.

## What it does

- **Sweep.** Inventories `CLAUDE.md`, `AGENTS.md`, specs, plans, README claims, `TODO`/`FIXME` notes, and agent memory. Extracts checkable claims.
- **Independent check.** A fresh checker gets only the bare claims, never the sweeper's suspicions. A claim is reported stale only with current code that contradicts it and the commit that made it false. Everything else is left alone.
- **Report, then wait.** Findings come back as Outdated, Conflicts (a rule or memory the code disobeys; you pick the side), and Untagged specs. Nothing changes until you approve ids.
- **Archive.** Approved files move to `<repo>/.archive/<same path>` with `git mv`. A `PreToolUse` hook blocks agent tool calls that read, search, or edit the archive, so retired context stays retired.

## Requirements

- Node 22 or later. No npm dependencies.
- git. `gh` optional, for checking whether a cited issue is closed.

## Install

Claude Code:

```
/plugin marketplace add walangstudio/marketplace
/plugin install delulint@walangstudio
```

Restart Claude Code, then run `/delulint:delulint` or `/delulint:delulint <repo path>`.

Codex:

```bash
codex plugin marketplace add walangstudio/marketplace
codex plugin add delulint@walangstudio
```

Start a new thread and ask Codex to run delulint. Approve the guard hook when Codex asks to trust it. Codex only reaches the hook for simple shell calls and `apply_patch`, so the archive guard is best-effort there.

## Rules

The sweep cleans up what is already stale. These rules stop new drift. Paste them into your `CLAUDE.md` or `AGENTS.md`:

```markdown
## Plans vs code

- Every spec or ticket carries a status: `not started`, `in progress`, or `completed`. Update it in the same change that moves the work.
- Code is the source of truth. Plan and code disagree: follow the code and report the mismatch. Exception: an `in progress` ticket - follow the plan, the code is half-built.
- A TODO, an old plan, or a stale note is not a request. Mention it, don't act on it.
- Feature request that is not in the specs: check it against the existing specs first. Overlap or conflict: name the spec and ask.
```

Start a fresh session for each new task. Long sessions keep every failed attempt in context.

## Limits

- The archive guard is hygiene, not security. It catches agents that name `.archive/`, not every route in. `git` commands are allowed so archiving works, which also lets `git show` read archived content.
- Search tools skip `.archive/` through its `.ignore` file. Plain file listings still show the names.
- The checker runs on the same model family as the sweeper. Independence comes from what it is told, not from a different model.

## Develop

```bash
npm run build
npm test
```

`bench/make-fixture.sh <dir>` builds a repo with 9 planted stale claims and 6 decoys; `bench/key.md` is the answer key. Claude Opus, Claude Sonnet, and Codex each find 9/9 with no false positives on it.

## License

MIT
