#!/usr/bin/env node
// PreToolUse guard for Claude Code and Codex: .archive/ holds files delulint retired.
// Reading them re-injects the stale context the sweep removed. Hygiene, not security:
// every failure path allows.
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ARCHIVED = /(^|[^\w.-])\.archive([\\/\s'"),;]|$)/i;
const EXCLUSIONS = /(?:--exclude-dir=|--glob[= ]['"]?!|-g\s+['"]?!)['"]?\.archive\S*/gi;
const PATCH_FILE = /^\*\*\* (?:(?:Add|Update|Delete) File|Move to): (.+)$/gm;
const GIT = /^\s*(?:&\s*)?(?:git(?:\.exe)?|"[^"]*[\\/]git(?:\.exe)?"|'[^']*[\\/]git(?:\.exe)?')\s(?![^]*&&)[^;|`\r\n]*$/i;
const REASON = 'Blocked by delulint: .archive/ holds retired files kept only as a record. Their content is obsolete. Do not read, search, or edit it, and do not work around this. Need one? Ask the user.';

const text = value => (Array.isArray(value) ? value.join(' ') : typeof value === 'string' ? value : '');

export function blocked(tool, input) {
  if (!input || typeof input !== 'object') return false;
  const paths = ['file_path', 'notebook_path', 'path', 'glob'];
  if (tool === 'Glob') paths.push('pattern'); // Grep's pattern is a content regex, not a path
  if (paths.some(field => typeof input[field] === 'string' && ARCHIVED.test(input[field]))) return true;
  const patch = text(input.patch ?? input.input);
  for (const [, file] of patch.matchAll(PATCH_FILE)) if (ARCHIVED.test(file)) return true;
  const command = text(input.command ?? input.cmd ?? input.script).replace(EXCLUSIONS, '');
  return ARCHIVED.test(command) && !GIT.test(command);
}

async function main() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  try {
    const event = JSON.parse(raw);
    if (blocked(event.tool_name, event.tool_input)) {
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: REASON },
      }));
    }
  } catch {}
}

const isMain = () => {
  try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; }
};
if (isMain()) await main();
