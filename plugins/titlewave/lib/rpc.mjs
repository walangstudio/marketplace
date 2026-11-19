import { spawn, execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));

export function nativeCommand(command) {
  if (process.platform !== 'win32') return command;
  if (!process.env.SystemRoot) throw new Error('Windows SystemRoot is missing from the environment.');
  try { return execFileSync(join(process.env.SystemRoot, 'System32', 'where.exe'), [`$PATH:${command}.exe`], { encoding: 'utf8', windowsHide: true }).trim().split(/\r?\n/)[0]; }
  catch { throw new Error(`Windows requires a native ${command}.exe on PATH; npm .cmd shims cannot be launched safely.`); }
}

export async function withRpc(command, args, action, dialect = 'codex') {
  const child = spawn(nativeCommand(command), args, { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
  const pending = new Map();
  let sequence = 0;
  let stderr = '';
  const fail = error => {
    for (const { reject, timer } of pending.values()) { clearTimeout(timer); reject(error); }
    pending.clear();
  };
  child.stderr.on('data', data => { stderr = (stderr + data).slice(-4096); });
  child.on('error', fail);
  child.on('exit', code => fail(new Error(`${command} exited (${code}): ${stderr.trim()}`)));
  child.stdin.on('error', fail);
  const lines = createInterface({ input: child.stdout });
  lines.on('line', line => {
    let message;
    try { message = JSON.parse(line); } catch { return; }
    const call = pending.get(message.id);
    if (!call) return;
    pending.delete(message.id);
    clearTimeout(call.timer);
    if (message.error || message.success === false) call.reject(new Error(typeof message.error === 'string' ? message.error : JSON.stringify(message.error)));
    else call.resolve(dialect === 'pi' ? message.data : message.result);
  });
  const notify = (method, params) => child.stdin.write(`${JSON.stringify({ method, ...(params && { params }) })}\n`);
  const request = (method, params = {}) => new Promise((resolve, reject) => {
    const id = String(++sequence);
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timed out`)); }, 15000);
    pending.set(id, { resolve, reject, timer });
    child.stdin.write(`${JSON.stringify(dialect === 'pi' ? { id, type: method, ...params } : { id, method, params })}\n`);
  });
  try {
    if (dialect === 'codex') {
      await request('initialize', { clientInfo: { name: 'titlewave', version } });
      notify('initialized');
    }
    return await action(request);
  } finally {
    lines.close();
    child.stdin.destroy();
    child.kill();
    fail(new Error('RPC connection closed'));
  }
}
