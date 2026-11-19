import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, renameSync, unlinkSync, realpathSync, statSync, chmodSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { withRpc, nativeCommand } from './rpc.mjs';

export function validateName(name) {
  if (typeof name !== 'string' || !name.trim() || name.startsWith('-') || /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u.test(name) || [...name].length > 200) {
    throw new Error('Use 1-200 characters, without a leading dash, control characters, or invisible formatting.');
  }
  return name;
}

export function sessionFor(agent, env = process.env) {
  return { claude: env.CLAUDE_CODE_SESSION_ID, codex: env.CODEX_THREAD_ID, gemini: env.GEMINI_SESSION_ID, goose: env.GOOSE_SESSION_ID }[agent];
}

export function detectAgent(env = process.env) {
  const agents = ['claude', 'codex', 'gemini', 'goose'].filter(agent => sessionFor(agent, env));
  if (agents.length !== 1) throw new Error('Pass --agent explicitly; the current agent is missing or ambiguous.');
  return agents[0];
}

export function renameGemini(file, id, name) {
  const original = readFileSync(file, 'utf8');
  if (file.endsWith('.jsonl')) {
    const lines = original.trimEnd().split('\n').map(line => JSON.parse(line));
    if (lines[0]?.sessionId !== id || typeof lines[0]?.projectHash !== 'string') throw new Error('Transcript does not match the Gemini session.');
    writeFileSync(file, `${original.endsWith('\n') ? '' : '\n'}${JSON.stringify({ $set: { summary: name } })}\n`, { flag: 'a' });
    return;
  }
  const session = JSON.parse(original);
  if (session.sessionId !== id || !Array.isArray(session.messages)) throw new Error('Transcript does not match the Gemini session.');
  session.summary = name;
  const temporary = `${file}.titlewave-${randomUUID()}`;
  const mode = statSync(file).mode & 0o777;
  try {
    writeFileSync(temporary, `${JSON.stringify(session, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
    chmodSync(temporary, mode);
    if (readFileSync(file, 'utf8') !== original) throw new Error('Session changed during rename; close Gemini and retry.');
    renameSync(temporary, file);
  } finally {
    try { unlinkSync(temporary); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}

export async function renameSession({ agent, session, name, url, transcript, offline }) {
  validateName(name);
  if (!['claude', 'codex', 'opencode', 'pi', 'goose', 'gemini'].includes(agent)) throw new Error(`Unknown agent: ${agent}`);
  if (!session || session.startsWith('-') || /[\p{Cc}\p{Cf}]/u.test(session)) throw new Error('Pass a valid --session ID (Pi uses its session file path).');
  switch (agent) {
    case 'claude': {
      const env = { ...process.env };
      delete env.CLAUDECODE;
      const output = execFileSync(nativeCommand('claude'), ['-p', '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}', '--settings', '{"disableAllHooks":true}', '--resume', session, `/rename ${name}`], { env, encoding: 'utf8', timeout: 30000, windowsHide: true });
      if (!output.includes('Session renamed to:')) throw new Error(`Claude did not confirm the rename: ${output.trim()}`);
      break;
    }
    case 'codex':
      await withRpc('codex', ['app-server', '--stdio'], request => request('thread/name/set', { threadId: session, name }));
      break;
    case 'opencode': {
      if (!url) throw new Error('Pass --url for the OpenCode server that owns the session.');
      const base = new URL(url);
      if (!['http:', 'https:'].includes(base.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(base.hostname) || base.username || base.password) throw new Error('OpenCode URL must be a loopback HTTP(S) address without credentials.');
      if (session === '.' || session === '..') throw new Error('OpenCode session ID cannot be a dot segment.');
      if (!base.pathname.endsWith('/')) base.pathname += '/';
      const headers = { 'Content-Type': 'application/json' };
      if (process.env.OPENCODE_SERVER_PASSWORD) headers.Authorization = `Basic ${Buffer.from(`${process.env.OPENCODE_SERVER_USERNAME || 'opencode'}:${process.env.OPENCODE_SERVER_PASSWORD}`).toString('base64')}`;
      const response = await fetch(new URL(`session/${encodeURIComponent(session)}`, base), { method: 'PATCH', headers, body: JSON.stringify({ title: name }), signal: AbortSignal.timeout(15000), redirect: 'error' });
      if (!response.ok) throw new Error(`OpenCode rename failed: HTTP ${response.status}`);
      const result = await response.json();
      if (result.id !== session || result.title !== name) throw new Error('OpenCode did not confirm the requested session and title.');
      break;
    }
    case 'pi':
      if (!offline) throw new Error('Use the Pi extension in a running session; --offline is required for a closed session file.');
      session = realpathSync(session);
      if (JSON.parse(readFileSync(session, 'utf8').split('\n')[0]).type !== 'session') throw new Error('Not a Pi session file.');
      await withRpc('pi', ['--mode', 'rpc', '--offline', '--no-extensions', '--no-skills', '--no-context-files', '--session', session], async request => {
        await request('set_session_name', { name });
        const state = await request('get_state');
        if (state.sessionName !== name) throw new Error('Pi did not confirm the rename.');
      }, 'pi');
      break;
    case 'goose':
      execFileSync(nativeCommand('goose'), ['session', 'rename', '--session-id', session, '--new-name', name], { encoding: 'utf8', timeout: 15000, windowsHide: true });
      break;
    case 'gemini':
      if (!offline || !transcript) throw new Error('Gemini requires a closed session: pass --offline and --transcript <session.json>.');
      renameGemini(transcript, session, name);
      break;
  }
}
