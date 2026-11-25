import { createReadStream } from 'node:fs';
import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, basename, join } from 'node:path';
import { createHash } from 'node:crypto';
import { createInterface } from 'node:readline';
import { spawn } from 'node:child_process';
import { validateName } from './agents.mjs';
import { nativeCommand, withRpc } from './rpc.mjs';
import { setTerminalTitle, terminalHost } from './terminal.mjs';

export async function sessionTitle({ agent, session, transcript, title, cwd }) {
  if (typeof session !== 'string' || !/^[\w-]+$/.test(session)) throw new Error('Resume requires an exact session ID.');
  if (agent === 'claude' && title !== undefined && title !== null) return title || undefined;
  if (agent === 'codex') {
    return withRpc('codex', ['app-server', '--stdio'], async request => {
      const { thread } = await request('thread/read', { threadId: session, includeTurns: false });
      if (thread.id !== session) throw new Error('Codex returned a different session.');
      return thread.name || undefined;
    }, 'codex', 15000);
  }
  if (agent === 'goose') {
    return new Promise((resolve, reject) => {
      const child = spawn(nativeCommand('goose'), ['session', 'list', '--format', 'json'], { stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000, killSignal: 'SIGKILL', windowsHide: true });
      let output = '';
      child.stdout.setEncoding('utf8').on('data', chunk => { output += chunk; });
      child.once('error', reject);
      child.once('close', code => {
        try {
          if (code !== 0) throw new Error('Goose metadata lookup failed.');
          let sessions;
          try { sessions = JSON.parse(output); } catch { throw new Error('Goose returned invalid session metadata.'); }
          const result = sessions.find(value => value.id === session);
          if (!result) throw new Error('Goose did not identify the resumed session.');
          if (result.name === 'CLI Session' && result.user_set_name === false) { resolve(undefined); return; }
          resolve(result.name || undefined);
        } catch (error) { reject(error); }
      });
    });
  }
  if (!['claude', 'gemini'].includes(agent)) throw new Error(`No resume reader for ${agent}.`);
  if (typeof transcript !== 'string' || !transcript) throw new Error('Resume requires the current transcript path.');
  let name, pending;
  try { name = await transcriptTitle(agent, session, transcript); }
  catch (error) { if (agent !== 'gemini' || !['ENOENT', 'EPENDING'].includes(error.code)) throw error; pending = error; }
  if (agent !== 'gemini' || name !== undefined) return name || undefined;
  const directory = dirname(transcript), directories = new Set([directory]);
  if (cwd && basename(directory) === 'chats' && basename(dirname(dirname(directory))) === 'tmp') {
    directories.add(join(dirname(dirname(directory)), createHash('sha256').update(cwd).digest('hex'), 'chats'));
  }
  let latest;
  for (const directory of directories) {
    let files;
    try { files = await readdir(directory); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    for (const file of files) {
      if (!file.startsWith('session-') || ![session, session.slice(0, 8)].some(id => file.endsWith(`-${id}.json`) || file.endsWith(`-${id}.jsonl`))) continue;
      const path = join(directory, file);
      if (path === transcript) continue;
      try {
        const name = await transcriptTitle(agent, session, path);
        const { mtimeMs } = await stat(path);
        if (name !== undefined && (!latest || mtimeMs > latest.time)) latest = { name, time: mtimeMs };
      } catch { /* A short-ID collision or incomplete sibling is not the resumed transcript. */ }
    }
  }
  if (!latest && pending) throw pending;
  return latest?.name || undefined;
}

async function transcriptTitle(agent, session, transcript) {
  if (agent === 'gemini' && !transcript.endsWith('.jsonl')) {
    const input = await readFile(transcript, 'utf8');
    if (!input.trim()) throw Object.assign(new Error('Gemini transcript is not written yet.'), { code: 'EPENDING' });
    let result;
    try { result = JSON.parse(input); }
    catch { throw Object.assign(new Error('Gemini transcript is incomplete.'), { code: 'EPENDING' }); }
    if (result.sessionId !== session) throw new Error('Transcript does not match the resumed session.');
    return result.summary;
  }
  const input = createReadStream(transcript, { encoding: 'utf8' });
  const lines = createInterface({ input, crlfDelay: Infinity });
  let first = true, matched = false, name;
  try {
    for await (const line of lines) {
      if (!line.trim()) continue;
      if (agent === 'claude' && !line.includes('"custom-title"')) continue;
      if (agent === 'gemini' && !first && !line.includes('"summary"')) continue;
      let record;
      try { record = JSON.parse(line); } catch {
        if (agent === 'gemini' && first) throw Object.assign(new Error('Gemini transcript header is incomplete.'), { code: 'EPENDING' });
        continue;
      }
      if (!record || typeof record !== 'object' || Array.isArray(record)) continue;
      if (agent === 'claude' && record.type === 'custom-title' && record.sessionId === session) { matched = true; name = record.customTitle; }
      if (agent === 'gemini') {
        if (first && record.sessionId !== session) throw new Error('Transcript does not match the resumed session.');
        first = false; matched = true;
        if ('summary' in record) name = record.summary;
        if (record.$set && typeof record.$set === 'object' && 'summary' in record.$set) name = record.$set.summary;
      }
    }
  } finally { lines.close(); input.destroy(); }
  if (agent === 'gemini' && !matched) throw Object.assign(new Error('Gemini transcript is not written yet.'), { code: 'EPENDING' });
  return agent === 'claude' ? name || undefined : name;
}

export async function restoreSessionTitle(agent, payload) {
  const resumed = payload?.source === 'resume' || agent === 'claude' && payload?.source === 'fork';
  if (agent === 'goose' ? payload?.event !== 'SessionStart' : payload?.hook_event_name !== 'SessionStart' || !resumed) return;
  try {
    terminalHost();
    const name = await sessionTitle({ agent, session: payload.session_id, transcript: payload.transcript_path, title: payload.session_title, cwd: payload.cwd });
    if (name !== undefined) return setTerminalTitle(validateName(name));
  } catch (error) {
    console.error(`titlewave: resume title not restored: ${error.message}`);
  }
}
