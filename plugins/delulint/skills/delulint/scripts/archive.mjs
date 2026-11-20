#!/usr/bin/env node
// Move approved files into <repo>/.archive/<same path> with git history kept.
// Usage: node archive.mjs <repo> <relative path>...
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export function archive(repo, files) {
  const root = resolve(repo);
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  if (git('rev-parse', '--show-prefix') !== '') throw new Error(`not a git repository root: ${root}`);
  const store = join(root, '.archive');
  const seen = new Set();
  for (const file of files) {
    const rel = normalize(file);
    const key = rel.toLowerCase();
    if (isAbsolute(rel) || rel === '..' || rel.startsWith(`..${sep}`)) throw new Error(`path must stay inside the repo: ${file}`);
    if (key === '.archive' || key.startsWith(`.archive${sep}`)) throw new Error(`already archived: ${file}`);
    if (seen.has(key)) throw new Error(`listed twice: ${file}`);
    seen.add(key);
    if (!existsSync(join(root, rel))) throw new Error(`missing: ${file}`);
    try { git('ls-files', '--error-unmatch', '--', rel); } catch { throw new Error(`not tracked by git: ${file}`); }
    if (existsSync(join(store, rel))) throw new Error(`archive already has: ${file}`);
  }
  mkdirSync(store, { recursive: true });
  const ignore = join(store, '.ignore');
  if (!existsSync(ignore)) writeFileSync(ignore, '*\n');
  git('add', '-f', '--', join('.archive', '.ignore'));
  const moved = [];
  for (const file of files) {
    const rel = normalize(file);
    mkdirSync(dirname(join(store, rel)), { recursive: true });
    git('mv', '--', rel, join('.archive', rel));
    moved.push(`${rel} -> .archive${sep}${rel}`);
  }
  return moved;
}

const isMain = () => {
  try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; }
};
if (isMain()) {
  const [repo, ...files] = process.argv.slice(2);
  if (!repo || files.length === 0) {
    console.error('usage: node archive.mjs <repo> <relative path>...');
    process.exit(2);
  }
  try {
    for (const line of archive(repo, files)) console.log(line);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
