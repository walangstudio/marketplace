---
name: delulint
description: Lint a repo's beliefs. Find outdated notes, plans, specs, agent instructions and memory that no longer match the code, prove each against git history with an independent checker, and report. Changes nothing without approval. Use when the user asks to run delulint, sweep for stale docs or plans, or check whether specs still match the code.
disable-model-invocation: true
---

# delulint

Target repo: the path the user gave, else the current directory. Not a git repo: stop and ask which one. Without history nothing can be proven.

`SKILL_DIR` is the directory containing this file. It also holds `verifier.md` and `scripts/archive.mjs`.

## Ground rules
- Report only. No edit, move, or delete before the user approves specific ids.
- Proof or silence. A finding needs current code that contradicts it AND the commit that made it false. Otherwise drop it.
- Never judge your own findings. Phase 3 does that.
- Never delete a file or a memory entry. Files move to `.archive/`. Memory entries get superseded or edited.
- Skip `.archive/`, `.git/`, dependencies, build output, and generated files.
- Run git as `git -C <repo> ...`.

## Phase 1 - Inventory
List candidate sources; do not read deeply yet:
- Agent instructions: `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, nested copies, `.claude/` and `.codex/` rules.
- Plans: whatever exists of `openspec/`, `specs/`, `.specify/`, `docs/`, `*PLAN*.md`, `ROADMAP*`, `TODO*`, tickets.
- README claims about paths, commands, counts, and versions.
- Code notes: `TODO|FIXME|HACK|XXX`, especially ones that cite an issue.
- Agent memory for this repo, if any: a `MEMORY.md` or memory folder, or `mememo search "<repo name>"` when `mememo` is installed.

Print counts per source. More than about 40 sources: do one source type per pass and say which remain.

## Phase 2 - Extract claims
From each source, pull statements that can be checked: a path exists, a command works, a thing is named X, feature Y is or is not built, bug N is open, a ticket has status S. Skip opinions, intent, and style rules.

Record per claim: id, source `file:line` (or memory id), the verbatim quote, and kind: `descriptive`, `rule`, or `memory`.

## Phase 3 - Verify independently
Hand claims to a fresh checker in batches of up to 20. Its instructions are `SKILL_DIR/verifier.md`. Send ONLY the repo path and, per claim, the id, the verbatim quote, and its source location. Never send your suspicion, the kind, a guessed verdict, or any hint about what changed.

- Claude Code: spawn one general-purpose subagent per batch, in parallel. Prompt = the full text of `verifier.md`, then the repo path and the claims.
- Codex: spawn a subagent the same way if subagents are available. Otherwise run one fresh read-only process per batch:
  `codex exec --skip-git-repo-check -s read-only -C <repo> -o <out file> "<verifier.md text + claims>"` with stdin closed, then read `<out file>`.

## Phase 4 - Classify
- `descriptive` + FALSE: Outdated.
- `rule` or `memory` + FALSE or DISAGREES: Conflict. Never call these outdated.
- Any FALSE claim from a spec or ticket marked `in progress`: Conflict. The code may be half-built.
- A spec or ticket with no status field: Untagged. Propose a status only from the checker's evidence.
- TRUE or UNPROVEN: dropped. Report the count only.

## Phase 5 - Report, then stop

    delulint: <repo> @ <short sha> - <n> sources, <n> claims, <n> dropped as true/unproven

    Outdated
    O1 <file:line> "<quote>" - now: <file:line>. Changed in <sha> (<date>). Proposed: archive file | fix line

    Conflicts (you decide which side is right)
    C1 <source> says "<quote>" - code: <file:line> since <sha>

    Untagged specs
    U1 <file> - evidence suggests <status> (<sha or file:line>)

End with: "Approve by id (e.g. O1 O3 C2=code U1)." Then wait.

## Phase 6 - Apply approved ids only
- Whole file obsolete: `node "SKILL_DIR/scripts/archive.mjs" <repo> <relative path>...`. It runs `git mv` into `.archive/<same path>` and adds `.archive/.ignore` so search tools skip the folder.
- Single stale line: edit exactly that line.
- Conflict resolved for the code: fix the rule line, or supersede the memory entry.
- Conflict resolved for the rule: do not change code here. Tell the user it is a separate task.
- Untagged: add the status in the layout's own field.
- No commit unless asked. List what changed.
